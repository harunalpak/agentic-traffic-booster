import { Scraper } from '@the-convocation/twitter-scraper';
import logger from '../utils/logger.js';
import { CONFIG, SEARCH_MODES, resolveSearchMode, getSearchModeName } from '../config/search.config.js';

// Try to import CycleTLS from twitter-scraper package
let cycleTLSFetch = null;
let cycleTLSExit = null;
let cycleTLSAvailable = false;

try {
  const cycleTLSModule = await import('@the-convocation/twitter-scraper/cycletls');
  cycleTLSFetch = cycleTLSModule.cycleTLSFetch;
  cycleTLSExit = cycleTLSModule.cycleTLSExit;
  cycleTLSAvailable = true;
  logger.info('✅ CycleTLS available for enhanced anti-bot protection');
} catch (e) {
  logger.info('ℹ️  CycleTLS not available, using default fetch (still secure)');
}

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
 * Scrape real tweets from Twitter for a campaign
 * @param {Object} campaign - Campaign configuration
 * @returns {Promise<Array>} Array of normalized tweet objects
 */
async function scrapeTweetsForCampaign(campaign) {
  const startTime = Date.now();
  const results = [];
  
  try {
    logger.info(`🔍 Starting real Twitter scraping for campaign ${campaign.id}`);
    
    // 0. Parse campaign config once at the beginning
    let campaignConfig = campaign.config;
    if (typeof campaignConfig === 'string') {
      try {
        campaignConfig = JSON.parse(campaignConfig);
      } catch (e) {
        logger.warn(`Failed to parse campaign config: ${e.message}`);
        campaignConfig = {};
      }
    }
    campaign.parsedConfig = campaignConfig; // Add parsed config to campaign object
    
    // 1. Build search query from campaign data
    const keyword = buildSearchQuery(campaign);
    if (!keyword || keyword.trim() === '') {
      logger.warn(`⚠️  No valid search query for campaign ${campaign.id}`);
      return null;
    }
    
    logger.info(`   Query: "${keyword}"`);
    
    // 2. Resolve numeric search mode
    const searchMode = resolveSearchMode(campaign.searchMode);
    const modeName = getSearchModeName(searchMode);
    logger.info(`   Search Mode: ${modeName} (${searchMode})`);
    
    // 3. Determine tweet limit
    const limit = CONFIG.maxTweetsPerScan;
    logger.info(`   Tweet Limit: ${limit}`);
    
    // 4. Initialize scraper with CycleTLS (create new instance for each scrape)
    const scraper = cycleTLSAvailable 
      ? new Scraper({ fetch: cycleTLSFetch })
      : new Scraper();
    
    logger.info(`   🔐 Authenticating with Twitter...`);
    
    // 5. Login to Twitter
    await scraper.login(
      process.env.TWITTER_USERNAME,
      process.env.TWITTER_PASSWORD,
      process.env.TWITTER_EMAIL
    );
    
    logger.info(`   ✅ Twitter login successful`);
    
    // 6. Scrape tweets
    logger.info('   🌐 Fetching tweets from Twitter...');
    logger.info(`   📋 Search params: keyword="${keyword}", limit=${limit}, mode=${searchMode}`);
    
    for await (const tweet of scraper.searchTweets(keyword, limit, searchMode)) {
      results.push(tweet);
    }
    
    logger.info(`   📥 Fetched ${results.length} raw tweets`);
    
    if (results.length === 0) {
      if (cycleTLSAvailable && cycleTLSExit) await cycleTLSExit();
      logger.info('   📭 No tweets found on Twitter');
      return [];
    }
    
    // 7. Apply time window filtering
    const config = campaign.parsedConfig || {};
    const recentWindowMinutes = config.recentWindowMinutes ?? campaign.recentWindowMinutes ?? CONFIG.recentWindowMinutes;
    const cutoffTime = Date.now() - (recentWindowMinutes * 60 * 1000);
    
    const recentTweets = results.filter(tweet => {
      const tweetTime = new Date(tweet.timeParsed).getTime();
      return tweetTime >= cutoffTime;
    });
    
    logger.info(`   ⏰ Time filter (last ${recentWindowMinutes} min): ${recentTweets.length} tweets`);
    
    if (recentTweets.length === 0) {
      if (cycleTLSAvailable && cycleTLSExit) await cycleTLSExit();
      logger.info('   📭 No tweets within time window');
      return [];
    }
    
    // 8. Apply follower count filtering and normalize tweet objects
    const minFollowerCount = config.minFollowerCount ?? campaign.minFollowerCount ?? CONFIG.minFollowers;
    const normalizedTweets = [];
    
    logger.info(`   👥 Fetching author profiles (min followers: ${minFollowerCount})...`);
    logger.info(`   📊 Total profiles to fetch: ${recentTweets.length}`);
    
    let profileIndex = 0;
    for (const tweet of recentTweets) {
      try {
        profileIndex++;
        logger.info(`   🔍 Fetching profile ${profileIndex}/${recentTweets.length}: @${tweet.username}`);
        
        // Fetch author profile to get follower count with timeout
        const profileStartTime = Date.now();
        const PROFILE_TIMEOUT = 10000; // 5 seconds timeout
        
        const profile = await Promise.race([
          scraper.getProfile(tweet.username),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), PROFILE_TIMEOUT)
          )
        ]);
        
        const profileFetchTime = Date.now() - profileStartTime;
        
        const followers = profile?.followersCount ?? 0;
        logger.info(`   ✅ @${tweet.username} - ${followers} followers (took ${profileFetchTime}ms)`);
        
        // Filter by minimum follower count
        if (followers >= minFollowerCount) {
          // Normalize tweet object
          normalizedTweets.push({
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
          });
          logger.info(`   ✅ Added tweet from @${tweet.username}`);
        } else {
          logger.info(`   ⏭️  Skipped @${tweet.username} (${followers} < ${minFollowerCount})`);
        }
        
      } catch (profileError) {
        logger.warn(`   ❌ Profile fetch failed for @${tweet.username}: ${profileError.message}`);
      }
    }
    
    // 9. Cleanup CycleTLS
    if (cycleTLSAvailable && cycleTLSExit) {
      await cycleTLSExit();
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logger.info(`   ✅ Real scraping complete: ${normalizedTweets.length} qualified tweets`);
    logger.info(`   ⏱️  Duration: ${duration}s`);
    logger.info('   📊 Filtering Summary:');
    logger.info(`      Raw tweets: ${results.length}`);
    logger.info(`      After time filter: ${recentTweets.length}`);
    logger.info(`      After follower filter: ${normalizedTweets.length}`);
    
    // Log tweet details for testing
    if (normalizedTweets.length > 0) {
      logger.info('   📝 Found Tweets:');
      normalizedTweets.forEach((tweet, index) => {
        logger.info(`      ${index + 1}. @${tweet.author} (${tweet.followers} followers)`);
        logger.info(`         "${tweet.text.substring(0, 100)}..."`);
        logger.info(`         🔗 ${tweet.link}`);
      });
    }
    
    return normalizedTweets;
    
  } catch (error) {
    // Cleanup on error
    try {
      if (cycleTLSAvailable && cycleTLSExit) await cycleTLSExit();
    } catch {}
    
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
      
      // Real scraping failed (returned null)
      logger.error('❌ Real scraping failed - returning empty results');
      return [];
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
    return [];
  }
}

/**
 * Build search query from campaign data
 * @param {Object} campaign 
 * @returns {string}
 */
export function buildSearchQuery(campaign) {
  // Use parsed config if available
  const config = campaign.parsedConfig || campaign.config || {};
  
  // Get hashtags from config or root level
  const hashtags = config.hashtags || campaign.hashtags || [];
  
  // If no hashtags found, return null (skip campaign)
  if (!hashtags || hashtags.length === 0) {
    logger.error(`❌ Campaign ${campaign.id} has no hashtags! Skipping.`);
    return null;
  }
  
  // Join hashtags with OR for broader search
  const query = hashtags.join(' OR ');
  logger.info(`   🏷️  Using ${hashtags.length} hashtag(s): ${hashtags.join(', ')}`);
  
  return query;
}

/**
 * Cleanup function to close CycleTLS connections
 */
export async function cleanup() {
  try {
    if (cycleTLSAvailable && cycleTLSExit) {
      logger.info('🧹 Cleaning up CycleTLS connections...');
      await cycleTLSExit();
      logger.info('✅ Cleanup complete');
    }
  } catch (error) {
    logger.debug('CycleTLS cleanup error (non-critical):', error.message);
  }
}

// Handle process termination
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
