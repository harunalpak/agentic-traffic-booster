import dotenv from 'dotenv';
dotenv.config();

import { scrapeTweets, buildSearchQuery } from './src/services/tweetScraper.js';
import { publishTweets } from './src/services/tweetPublisher.js';
import { getActiveCampaigns } from './src/services/campaignClient.js';

async function test() {
  console.log('Testing tweet scout...');
  
  // Fetch campaigns
  const campaigns = await getActiveCampaigns();
  console.log(`Found ${campaigns.length} campaigns`);
  
  if (campaigns.length > 0) {
    const campaign = campaigns[0];
    console.log(`Testing campaign: ${campaign.name}`);
    
    // Scrape tweets
    const query = buildSearchQuery(campaign);
    const tweets = await scrapeTweets(query, 5, campaign);
    console.log(`Found ${tweets.length} tweets`);
    
    // Publish to Kafka
    if (tweets.length > 0) {
      await publishTweets(campaign.id, tweets);
      console.log('Published to Kafka!');
    }
  }
  
  process.exit(0);
}

test();