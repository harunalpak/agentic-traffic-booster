import cron from 'node-cron';
import { getActiveCampaigns } from '../services/campaignClient.js';
import { scrapeTweets, buildSearchQuery } from '../services/tweetScraper.js';
import { publishTweets } from '../services/tweetPublisher.js';
import logger from '../utils/logger.js';

// Get interval from environment (default: every 30 minutes)
const SCRAPE_INTERVAL_MINUTES = parseInt(process.env.SCRAPE_INTERVAL_MINUTES || '1', 10);
const MAX_TWEETS_PER_CAMPAIGN = parseInt(process.env.MAX_TWEETS_PER_CAMPAIGN || '10', 10);

/**
 * Main tweet scouting function
 */
async function scoutTweetsForAllCampaigns() {
  logger.info('========================================');
  logger.info('🔍 Tweet Scout: Starting tweet discovery');
  logger.info('========================================');
  
  const startTime = Date.now();
  let totalTweetsFound = 0;
  let totalTweetsPublished = 0;
  let campaignsProcessed = 0;
  let campaignsFailed = 0;
  
  try {
    // 1. Fetch active campaigns
    const campaigns = await getActiveCampaigns();
    
    if (!campaigns || campaigns.length === 0) {
      logger.info('⚠️  No active campaigns found. Skipping tweet scouting.');
      logger.info('========================================');
      return;
    }
    
    logger.info(`📋 Processing ${campaigns.length} active campaigns`);
    
    // 2. Process each campaign
    for (const campaign of campaigns) {
      try {
        logger.info('----------------------------------------');
        logger.info(`📌 Campaign: ${campaign.name} (ID: ${campaign.id})`);
        logger.info(`   Mode: ${campaign.mode || 'SEMI_AUTO'}`);
        logger.info(`   Status: ${campaign.status}`);
        
        // Build search query for validation
        const query = buildSearchQuery(campaign);
        
        if (!query || query.trim() === '') {
          logger.warn(`⚠️  No search query could be built for campaign ${campaign.id}`);
          continue;
        }
        
        logger.info(`   Query: "${query}"`);
        
        // 3. Scrape tweets using real Twitter scraping (pass full campaign object)
        const tweets = await scrapeTweets(query, MAX_TWEETS_PER_CAMPAIGN, campaign);
        totalTweetsFound += tweets.length;
        
        if (tweets.length === 0) {
          logger.info(`   📭 No new tweets found`);
          campaignsProcessed++;
          continue;
        }
        
        logger.info(`   📨 Found ${tweets.length} tweets`);
        
        // 4. Publish to Kafka
        const publishedCount = await publishTweets(campaign.id, tweets);
        totalTweetsPublished += publishedCount;
        
        if (publishedCount > 0) {
          logger.info(`   ✅ Published ${publishedCount} tweets to Kafka`);
        } else {
          logger.warn(`   ⚠️  Failed to publish tweets`);
        }
        
        campaignsProcessed++;
        
        // Small delay to avoid rate limiting
        await sleep(1000);
        
      } catch (error) {
        campaignsFailed++;
        logger.error({
          campaignId: campaign.id,
          campaignName: campaign.name,
          error: error.message
        }, `❌ Error processing campaign ${campaign.id}`);
      }
    }
    
  } catch (error) {
    logger.error({ error: error.message }, '❌ Fatal error in tweet scout scheduler');
  }
  
  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  logger.info('========================================');
  logger.info('📊 Tweet Scout Summary:');
  logger.info(`   Campaigns Processed: ${campaignsProcessed}`);
  logger.info(`   Campaigns Failed: ${campaignsFailed}`);
  logger.info(`   Total Tweets Found: ${totalTweetsFound}`);
  logger.info(`   Total Tweets Published: ${totalTweetsPublished}`);
  logger.info(`   Duration: ${duration}s`);
  logger.info('========================================');
  logger.info(`⏰ Next execution in ${SCRAPE_INTERVAL_MINUTES} minutes`);
  logger.info('========================================');
}

/**
 * Helper function to sleep
 * @param {number} ms 
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate cron expression based on interval
 * @param {number} minutes 
 * @returns {string}
 */
function getCronExpression(minutes) {
  // For intervals less than 60 minutes, use minute-based cron
  if (minutes < 60) {
    return `*/${minutes} * * * *`;
  }
  
  // For hourly intervals
  const hours = Math.floor(minutes / 60);
  if (minutes % 60 === 0) {
    return `0 */${hours} * * *`;
  }
  
  // Default to every 30 minutes
  return '*/30 * * * *';
}

// Schedule the job
const cronExpression = getCronExpression(SCRAPE_INTERVAL_MINUTES);

logger.info(`📅 Scheduling tweet scout with cron: "${cronExpression}"`);
logger.info(`   Interval: Every ${SCRAPE_INTERVAL_MINUTES} minutes`);
logger.info(`   Max tweets per campaign: ${MAX_TWEETS_PER_CAMPAIGN}`);

// Run immediately on startup (optional, comment out if not desired)
if (process.env.RUN_ON_STARTUP === 'true') {
  logger.info('🚀 Running initial scout on startup...');
  setTimeout(() => {
    scoutTweetsForAllCampaigns().catch(error => {
      logger.error({ error: error.message }, 'Error in initial scout run');
    });
  }, 5000); // Wait 5 seconds for services to be ready
}

// Schedule recurring job
cron.schedule(cronExpression, async () => {
  await scoutTweetsForAllCampaigns();
}, {
  scheduled: true,
  timezone: process.env.TZ || 'UTC'
});

logger.info('✅ Tweet Scout Scheduler initialized');
