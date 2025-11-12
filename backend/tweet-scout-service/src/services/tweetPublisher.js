import { getProducer, TOPICS } from '../config/kafka.js';
import logger from '../utils/logger.js';

/**
 * Publish discovered tweets to Kafka
 * @param {number} campaignId 
 * @param {Array} tweets 
 * @returns {Promise<number>} Number of successfully published tweets
 */
export async function publishTweets(campaignId, tweets) {
  if (!tweets || tweets.length === 0) {
    logger.info('No tweets to publish');
    return 0;
  }
  
  try {
    const producer = await getProducer();
    let publishedCount = 0;
    
    // Prepare messages for batch sending
    const messages = tweets.map(tweet => ({
      key: tweet.tweetId,
      value: JSON.stringify({
        ...tweet,
        campaignId: campaignId
      }),
      timestamp: new Date().getTime().toString()
    }));
    
    // Send messages in batch
    await producer.send({
      topic: TOPICS.NEW_TWEETS,
      messages: messages
    });
    
    publishedCount = messages.length;
    
    logger.info({
      campaignId,
      count: publishedCount,
      topic: TOPICS.NEW_TWEETS
    }, `✅ Published ${publishedCount} tweets to Kafka`);
    
    return publishedCount;
    
  } catch (error) {
    logger.error({
      campaignId,
      error: error.message,
      tweetsCount: tweets.length
    }, '❌ Error publishing tweets to Kafka');
    
    // Try to send to dead letter queue
    try {
      await sendToDeadLetterQueue(campaignId, tweets, error.message);
    } catch (dlqError) {
      logger.error({ error: dlqError.message }, 'Failed to send to dead letter queue');
    }
    
    return 0;
  }
}

/**
 * Send failed messages to dead letter queue
 * @param {number} campaignId 
 * @param {Array} tweets 
 * @param {string} errorMessage 
 */
async function sendToDeadLetterQueue(campaignId, tweets, errorMessage) {
  try {
    const producer = await getProducer();
    
    const dlqMessage = {
      key: `failed_${campaignId}_${Date.now()}`,
      value: JSON.stringify({
        campaignId,
        tweets,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        service: 'tweet-scout-service'
      })
    };
    
    await producer.send({
      topic: TOPICS.DEAD_LETTER,
      messages: [dlqMessage]
    });
    
    logger.info('Sent failed messages to dead letter queue');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to send to DLQ');
  }
}

/**
 * Publish a single tweet to Kafka
 * @param {number} campaignId 
 * @param {Object} tweet 
 */
export async function publishSingleTweet(campaignId, tweet) {
  return await publishTweets(campaignId, [tweet]);
}
