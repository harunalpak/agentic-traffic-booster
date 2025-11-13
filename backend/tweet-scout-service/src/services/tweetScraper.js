import { Scraper } from '@the-convocation/twitter-scraper';
import logger from '../utils/logger.js';
import { CONFIG, SEARCH_MODES, resolveSearchMode, getSearchModeName } from '../config/search.config.js';

// Try to import CycleTLS if available (optional dependency)
let CycleTLS = null;
let cycleTLSAvailable = false;
try {
  CycleTLS = (await import('cycletls')).default;
  cycleTLSAvailable = true;
  logger.info('✅ CycleTLS available for enhanced anti-bot protection');
} catch (e) {
  logger.info('ℹ️  CycleTLS not available, using default fetch (still secure)');
}

// Track scraper instance to reuse login sessions
let scraperInstance = null;
let cycleTLSInstance = null;
let isLoggedIn = false;

/**
 * Validate Twitter credentials are present
 * @returns {boolean} True if all credentials are present
 */
function validateTwitterCredentials() {
  const username = process.env.TWITTER_USERNAME;
  const password = process.env.TWITTER_PASSWORD;
  const email = process.env.TWITTER_EMAIL;
  
  if (!username || !password || !email) {
    logger.error('❌ Missing Twitter credentials. Required: TWITTER_USERNAME, TWITTER_PASSWORD, TWITTER_EMAIL');
    return false;
  }
  
  if (username === 'your_twitter_username' || password === 'your_twitter_password') {
    logger.error('❌ Twitter credentials not configured properly. Please update environment variables.');
    return false;
  }
  
  return true;
}

/**
 * Initialize and login to Twitter scraper
 * @returns {Promise<Scraper>} Logged in scraper instance
 */
async function getAuthenticatedScraper() {
  try {
    // Return existing logged-in scraper if available
    if (scraperInstance && isLoggedIn) {
      logger.debug('♻️  Reusing existing Twitter session');
      return scraperInstance;
    }
    
    // Validate credentials
    if (!validateTwitterCredentials()) {
      throw new Error('Twitter credentials not configured');
    }
    
    const protectionType = cycleTLSAvailable ? 'with CycleTLS' : 'with standard protection';
    logger.info(`🔐 Initializing Twitter scraper ${protectionType}...`);
    
    // Initialize scraper with optional CycleTLS for enhanced anti-bot protection
    if (cycleTLSAvailable && !cycleTLSInstance) {
      cycleTLSInstance = new CycleTLS();
      scraperInstance = new Scraper({ 
        fetch: cycleTLSInstance.fetch.bind(cycleTLSInstance)
      });
    } else {
      scraperInstance = new Scraper();
    }
    
    // Login to Twitter
    logger.info('🔑 Logging into Twitter...');
    await scraperInstance.login(
      process.env.TWITTER_USERNAME,
      process.env.TWITTER_PASSWORD,
      process.env.TWITTER_EMAIL
    );
    
    isLoggedIn = true;
    logger.info(`✅ Twitter login successful (${protectionType})`);
    
    return scraperInstance;
    
  } catch (error) {
    logger.error({ error: error.message }, '❌ Failed to authenticate with Twitter');
    isLoggedIn = false;
    scraperInstance = null;
    throw error;
  }
}

/**
 * Scrape real tweets from Twitter for a campaign
 * @param {Object} campaign - Campaign configuration
 * @returns {Promise<Array>} Array of normalized tweet objects
 */
async function scrapeTweetsForCampaign(campaign) {
  const startTime = Date.now();
  const results = [];
  
  try {
    logger.info(`🔍 Starting real Twitter scraping for campaign ${campaign.id}`);
    
    // 1. Get authenticated scraper
    const scraper = await getAuthenticatedScraper();
    
    // 2. Build search query from campaign data
    const keyword = buildSearchQuery(campaign);
    if (!keyword || keyword.trim() === '') {
      logger.warn(`⚠️  No valid search query for campaign ${campaign.id}`);
      return null;
    }
    
    logger.info(`   Query: "${keyword}"`);
    
    // 3. Resolve numeric search mode
    const searchMode = resolveSearchMode(campaign.searchMode);
    const modeName = getSearchModeName(searchMode);
    logger.info(`   Search Mode: ${modeName} (${searchMode})`);
    
    // 4. Determine tweet limit
    const limit = campaign.dailyLimit ?? campaign.maxTweetsPerCampaign ?? CONFIG.maxTweetsPerScan;
    logger.info(`   Tweet Limit: ${limit}`);
    
    // 5. Perform real Twitter scraping
    logger.info('   🌐 Fetching tweets from Twitter...');
    const iterator = scraper.searchTweets(keyword, limit, searchMode);
    
    let rawCount = 0;
    for await (const tweet of iterator) {
      results.push(tweet);
      rawCount++;
      
      // Stop if we've reached the limit
      if (rawCount >= limit) {
        break;
      }
    }
    
    logger.info(`   📥 Fetched ${rawCount} raw tweets`);
    
    if (rawCount === 0) {
      logger.info('   📭 No tweets found on Twitter');
      return [];
    }
    
    // 6. Apply time window filtering
    const recentWindowMinutes = campaign.recentWindowMinutes ?? CONFIG.recentWindowMinutes;
    const cutoffTime = Date.now() - (recentWindowMinutes * 60 * 1000);
    
    const recentTweets = results.filter(tweet => {
      const tweetTime = new Date(tweet.timeParsed).getTime();
      return tweetTime >= cutoffTime;
    });
    
    logger.info(`   ⏰ Time filter (last ${recentWindowMinutes} min): ${recentTweets.length} tweets`);
    
    if (recentTweets.length === 0) {
      logger.info('   📭 No tweets within time window');
      return [];
    }
    
    // 7. Apply follower count filtering and normalize tweet objects
    const minFollowerCount = campaign.minFollowerCount ?? CONFIG.minFollowers;
    const normalizedTweets = [];
    
    logger.info(`   👥 Fetching author profiles (min followers: ${minFollowerCount})...`);
    
    for (const tweet of recentTweets) {
      try {
        // Fetch author profile to get follower count
        const profile = await scraper.getProfile(tweet.username);
        const followers = profile?.followersCount ?? 0;
        
        // Filter by minimum follower count
        if (followers >= minFollowerCount) {
          // Normalize tweet object
          const normalizedTweet = {
            tweetId: tweet.id || tweet.id_str,
            campaignId: campaign.id,
            author: tweet.username,
            text: tweet.text,
            createdAt: tweet.timeParsed,
            link: tweet.permanentUrl,
            followers: followers,
            likes: tweet.likes ?? 0,
            retweets: tweet.retweets ?? 0,
            replies: tweet.replies ?? 0,
            language: tweet.lang ?? 'en',
            verified: profile?.isVerified ?? false,
            profileUrl: `https://twitter.com/${tweet.username}`
          };
          
          normalizedTweets.push(normalizedTweet);
        } else {
          logger.debug(`   ⚠️  Skipped @${tweet.username} (${followers} followers < ${minFollowerCount})`);
        }
        
      } catch (profileError) {
        logger.warn({ 
          username: tweet.username, 
          error: profileError.message 
        }, `   ⚠️  Failed to fetch profile for @${tweet.username}`);
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.info(`   ✅ Real scraping complete: ${normalizedTweets.length} qualified tweets`);
    logger.info(`   ⏱️  Duration: ${duration}s`);
    logger.info('   📊 Filtering Summary:');
    logger.info(`      Raw tweets: ${rawCount}`);
    logger.info(`      After time filter: ${recentTweets.length}`);
    logger.info(`      After follower filter: ${normalizedTweets.length}`);
    
    return normalizedTweets;
    
  } catch (error) {
    logger.error({ 
      campaignId: campaign.id, 
      error: error.message,
      stack: error.stack 
    }, '❌ Real scraping error');
    
    // Return null to trigger fallback to mock tweets
    return null;
  }
}

/**
 * Main entry point for tweet scraping with fallback to mock tweets
 * @param {string} query - Search query (for backward compatibility)
 * @param {number} limit - Tweet limit (for backward compatibility)
 * @param {Object} campaign - Full campaign object (preferred)
 * @returns {Promise<Array>} Array of tweet objects
 */
export async function scrapeTweets(query, limit = 10, campaign = null) {
  try {
    // If campaign object is provided, use real scraping
    if (campaign) {
      logger.info(`🚀 Initiating real Twitter scrape for campaign ${campaign.id}`);
      
      const realTweets = await scrapeTweetsForCampaign(campaign);
      
      // Check if real scraping succeeded
      if (realTweets && realTweets.length > 0) {
        logger.info(`✅ Real scraping successful: ${realTweets.length} tweets`);
        return realTweets;
      }
      
      // Check if real scraping returned empty array (valid but no results)
      if (realTweets && realTweets.length === 0) {
        logger.info('✅ Real scraping completed but found no qualifying tweets');
        return [];
      }
      
      // Real scraping failed (returned null), fallback to mock
      logger.warn('⚠️  Real scraping failed, checking fallback options...');
      
      if (process.env.USE_MOCK_TWEETS === 'true') {
        logger.warn('🔄 Using mock tweets as fallback');
        return generateMockTweets(campaign, limit);
      } else {
        logger.error('❌ Real scraping failed and mock tweets disabled');
        return [];
      }
    }
    
    // Legacy mode: simple query-based scraping (backward compatibility)
    logger.info(`🔍 Legacy scraping mode for query: "${query}" (limit: ${limit})`);
    
    const scraper = await getAuthenticatedScraper();
    const results = [];
    const iterator = scraper.searchTweets(query, limit, SEARCH_MODES.LATEST);
    
    for await (const tweet of iterator) {
      const tweetData = {
        tweetId: tweet.id || tweet.id_str,
        author: tweet.username || tweet.screen_name,
        text: tweet.text || tweet.full_text,
        url: tweet.permanentUrl || `https://twitter.com/${tweet.username}/status/${tweet.id}`,
        likes: tweet.likes || tweet.favoriteCount || 0,
        retweets: tweet.retweets || tweet.retweetCount || 0,
        replies: tweet.replies || tweet.replyCount || 0,
        language: tweet.lang || 'en',
        createdAt: tweet.timeParsed || tweet.timestamp || new Date().toISOString()
      };
      
      results.push(tweetData);
      
      if (results.length >= limit) {
        break;
      }
    }
    
    logger.info(`✅ Found ${results.length} tweets (legacy mode)`);
    return results;
    
  } catch (error) {
    logger.error({ query, error: error.message }, '❌ Error scraping tweets');
    
    // Fallback to mock tweets if enabled
    if (process.env.USE_MOCK_TWEETS === 'true') {
      logger.info('⚠️  Using mock tweets as fallback');
      return generateMockTweets(campaign || { keywords: [query] }, limit);
    }
    
    return [];
  }
}

/**
 * Generate mock tweets for development/testing or fallback
 * @param {Object} campaign - Campaign object
 * @param {number} limit - Number of mock tweets to generate
 * @returns {Array}
 */
function generateMockTweets(campaign, limit = 5) {
  const mockTweets = [];
  const now = Date.now();
  
  // Extract query info from campaign
  const query = buildSearchQuery(campaign);
  const campaignId = campaign?.id || 0;
  
  for (let i = 0; i < Math.min(limit, 5); i++) {
    const tweetTime = new Date(now - (i * 600000)); // 10 minutes apart
    
    mockTweets.push({
      tweetId: `mock_${Date.now()}_${i}`,
      campaignId: campaignId,
      author: `mockuser_${i}`,
      text: `Mock tweet about ${query}! Looking for recommendations. #mock #testing`,
      createdAt: tweetTime.toISOString(),
      link: `https://twitter.com/mockuser_${i}/status/mock_${Date.now()}_${i}`,
      followers: 500 + (i * 100),
      likes: Math.floor(Math.random() * 100),
      retweets: Math.floor(Math.random() * 50),
      replies: Math.floor(Math.random() * 20),
      language: 'en',
      verified: false,
      profileUrl: `https://twitter.com/mockuser_${i}`
    });
  }
  
  logger.info(`🎭 Generated ${mockTweets.length} mock tweets for campaign ${campaignId}`);
  
  return mockTweets;
}

/**
 * Build search query from campaign data
 * @param {Object} campaign 
 * @returns {string}
 */
export function buildSearchQuery(campaign) {
  const queryParts = [];
  
  // Add hashtags
  if (campaign.hashtags && campaign.hashtags.length > 0) {
    queryParts.push(...campaign.hashtags);
  }
  
  // Add keywords
  if (campaign.keywords && campaign.keywords.length > 0) {
    queryParts.push(...campaign.keywords);
  }
  
  // Fallback to campaign name if no hashtags or keywords
  if (queryParts.length === 0 && campaign.name) {
    queryParts.push(campaign.name);
  }
  
  // Join with OR for broader search
  return queryParts.join(' OR ');
}

/**
 * Cleanup function to close scraper and CycleTLS
 */
export async function cleanup() {
  try {
    if (scraperInstance) {
      logger.info('🧹 Cleaning up Twitter scraper...');
      
      // Cleanup CycleTLS if it was used
      if (cycleTLSAvailable && cycleTLSInstance) {
        try {
          await cycleTLSInstance.exit();
        } catch (e) {
          logger.debug('CycleTLS cleanup error (non-critical):', e.message);
        }
      }
      
      scraperInstance = null;
      cycleTLSInstance = null;
      isLoggedIn = false;
      logger.info('✅ Scraper cleanup complete');
    }
  } catch (error) {
    logger.warn({ error: error.message }, 'Warning during scraper cleanup');
  }
}

// Handle process termination
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
