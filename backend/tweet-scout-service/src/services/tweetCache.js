import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';

// Cache key prefix for tweet IDs
const TWEET_CACHE_PREFIX = 'tweet:seen:';
const TWEET_TTL = 24 * 60 * 60; // 24 hours in seconds

/**
 * Check if a tweet has been seen before (exists in cache)
 * @param {string} tweetId - The tweet ID to check
 * @returns {Promise<boolean>} True if tweet was seen before
 */
export async function isTweetSeen(tweetId) {
  try {
    const redis = await getRedisClient();
    const key = `${TWEET_CACHE_PREFIX}${tweetId}`;
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    logger.warn({ tweetId, error: error.message }, '⚠️  Redis check failed, assuming tweet is new');
    return false; // If Redis fails, don't block the tweet
  }
}

/**
 * Mark a tweet as seen by adding it to cache
 * @param {string} tweetId - The tweet ID to mark as seen
 * @param {number} campaignId - Campaign ID for additional context
 * @returns {Promise<boolean>} True if successfully cached
 */
export async function markTweetAsSeen(tweetId, campaignId) {
  try {
    const redis = await getRedisClient();
    const key = `${TWEET_CACHE_PREFIX}${tweetId}`;
    
    // Store tweet ID with campaign info and TTL
    await redis.setex(
      key,
      TWEET_TTL,
      JSON.stringify({
        campaignId,
        firstSeen: new Date().toISOString()
      })
    );
    
    logger.debug({ tweetId, campaignId }, '✅ Tweet marked as seen');
    return true;
  } catch (error) {
    logger.warn({ tweetId, campaignId, error: error.message }, '⚠️  Failed to mark tweet as seen');
    return false;
  }
}

/**
 * Check multiple tweets at once and return only unseen ones
 * @param {Array} tweets - Array of tweet objects with id property
 * @returns {Promise<Array>} Array of tweets that haven't been seen
 */
export async function filterUnseenTweets(tweets) {
  if (!tweets || tweets.length === 0) {
    return [];
  }

  try {
    const redis = await getRedisClient();
    
    // Create pipeline for batch checking
    const pipeline = redis.pipeline();
    
    tweets.forEach(tweet => {
      const tweetId = tweet.tweetId || tweet.id;
      const key = `${TWEET_CACHE_PREFIX}${tweetId}`;
      pipeline.exists(key);
    });
    
    // Execute all checks at once
    const results = await pipeline.exec();
    
    // Filter tweets that don't exist in cache (unseen)
    const unseenTweets = tweets.filter((tweet, index) => {
      const [err, exists] = results[index];
      if (err) {
        const tweetId = tweet.tweetId || tweet.id;
        logger.warn({ tweetId, error: err.message }, 'Error checking tweet');
        return true; // If error, include the tweet
      }
      return exists === 0; // Include if not in cache
    });
    
    const seenCount = tweets.length - unseenTweets.length;
    
    if (seenCount > 0) {
      logger.info(`🔍 Filtered out ${seenCount} already-seen tweets, ${unseenTweets.length} new tweets`);
    }
    
    return unseenTweets;
    
  } catch (error) {
    logger.error({ error: error.message }, '❌ Failed to filter tweets, returning all');
    return tweets; // If Redis fails, return all tweets
  }
}

/**
 * Mark multiple tweets as seen at once
 * @param {Array} tweets - Array of tweet objects with id property
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<number>} Number of tweets successfully cached
 */
export async function markTweetsAsSeen(tweets, campaignId) {
  if (!tweets || tweets.length === 0) {
    return 0;
  }

  try {
    const redis = await getRedisClient();
    const pipeline = redis.pipeline();
    
    const payload = JSON.stringify({
      campaignId,
      firstSeen: new Date().toISOString()
    });
    
    const cachedIds = [];
    tweets.forEach(tweet => {
      const tweetId = tweet.tweetId || tweet.id;
      if (!tweetId) {
        logger.warn({ tweet }, '⚠️  Tweet missing ID, skipping cache');
        return;
      }
      const key = `${TWEET_CACHE_PREFIX}${tweetId}`;
      pipeline.setex(key, TWEET_TTL, payload);
      cachedIds.push(tweetId);
    });
    
    await pipeline.exec();
    
    logger.info({ 
      count: cachedIds.length, 
      campaignId,
      tweetIds: cachedIds
    }, `✅ Marked ${cachedIds.length} tweets as seen`);
    
    return tweets.length;
    
  } catch (error) {
    logger.error({ 
      count: tweets.length, 
      campaignId, 
      error: error.message 
    }, '❌ Failed to mark tweets as seen');
    return 0;
  }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache stats
 */
export async function getCacheStats() {
  try {
    const redis = await getRedisClient();
    const keys = await redis.keys(`${TWEET_CACHE_PREFIX}*`);
    
    return {
      totalCachedTweets: keys.length,
      cachePrefix: TWEET_CACHE_PREFIX,
      ttlHours: TWEET_TTL / 3600
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get cache stats');
    return {
      totalCachedTweets: 0,
      error: error.message
    };
  }
}

/**
 * Clear all cached tweets (for testing/maintenance)
 * @returns {Promise<number>} Number of keys deleted
 */
export async function clearTweetCache() {
  try {
    const redis = await getRedisClient();
    const keys = await redis.keys(`${TWEET_CACHE_PREFIX}*`);
    
    if (keys.length === 0) {
      logger.info('No cached tweets to clear');
      return 0;
    }
    
    await redis.del(...keys);
    logger.info(`🗑️  Cleared ${keys.length} cached tweets`);
    return keys.length;
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to clear tweet cache');
    return 0;
  }
}
