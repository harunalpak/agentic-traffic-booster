import { Scraper } from '@the-convocation/twitter-scraper';
import logger from '../utils/logger.js';

/**
 * Scrape tweets from Twitter based on a search query
 * @param {string} query - Search query (keywords, hashtags)
 * @param {number} limit - Maximum number of tweets to fetch
 * @returns {Promise<Array>} Array of tweet objects
 */
export async function scrapeTweets(query, limit = 10) {
  try {
    logger.info(`🔍 Scraping tweets for query: "${query}" (limit: ${limit})`);
    
    const scraper = new Scraper();
    const results = [];
    
    // Search tweets using the scraper
    const tweets = scraper.searchTweets(query, limit);
    
    for await (const tweet of tweets) {
      try {
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
        
        // Stop if we've reached the limit
        if (results.length >= limit) {
          break;
        }
      } catch (parseError) {
        logger.warn({ error: parseError.message }, 'Error parsing individual tweet');
      }
    }
    
    logger.info(`✅ Found ${results.length} tweets`);
    return results;
    
  } catch (error) {
    logger.error({ query, error: error.message }, '❌ Error scraping tweets');
    
    // If scraping fails, return mock tweets for development
    if (process.env.USE_MOCK_TWEETS === 'true') {
      logger.info('⚠️  Using mock tweets as fallback');
      return generateMockTweets(query, limit);
    }
    
    return [];
  }
}

/**
 * Generate mock tweets for development/testing
 * @param {string} query 
 * @param {number} limit 
 * @returns {Array}
 */
function generateMockTweets(query, limit) {
  const mockTweets = [];
  const now = new Date();
  
  for (let i = 0; i < Math.min(limit, 5); i++) {
    mockTweets.push({
      tweetId: `mock_${Date.now()}_${i}`,
      author: `user_${i}`,
      text: `Looking for ${query} products! Any recommendations? #handmade #gifts`,
      url: `https://twitter.com/user_${i}/status/mock_${Date.now()}_${i}`,
      likes: Math.floor(Math.random() * 100),
      retweets: Math.floor(Math.random() * 50),
      replies: Math.floor(Math.random() * 20),
      language: 'en',
      createdAt: new Date(now.getTime() - i * 3600000).toISOString()
    });
  }
  
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
