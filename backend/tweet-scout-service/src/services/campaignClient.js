import axios from 'axios';
import logger from '../utils/logger.js';

const CAMPAIGN_SERVICE_URL = process.env.CAMPAIGN_SERVICE_URL || 'http://localhost:8082';

/**
 * Fetch active campaigns from campaign-service
 * @returns {Promise<Array>} List of active campaigns
 */
export async function getActiveCampaigns() {
  try {
    logger.info(`📡 Fetching active campaigns from: ${CAMPAIGN_SERVICE_URL}`);
    
    const response = await axios.get(`${CAMPAIGN_SERVICE_URL}/api/campaigns`, {
      params: {
        status: 'ACTIVE'
      },
      timeout: 10000
    });
    
    // Filter only ACTIVE campaigns (backend might not filter correctly)
    const allCampaigns = response.data;
    const campaigns = Array.isArray(allCampaigns) 
      ? allCampaigns.filter(c => c.status === 'ACTIVE')
      : [];
    
    logger.info(`✅ Retrieved ${campaigns.length} active campaigns (filtered from ${allCampaigns.length} total)`);
    
    return campaigns;
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logger.error(`❌ Cannot connect to campaign-service at ${CAMPAIGN_SERVICE_URL}`);
    } else if (error.response) {
      logger.error(`❌ Campaign service responded with status ${error.response.status}`);
    } else {
      logger.error({ error: error.message }, '❌ Error fetching active campaigns');
    }
    
    return [];
  }
}

/**
 * Fetch a specific campaign by ID
 * @param {number} campaignId 
 * @returns {Promise<Object|null>}
 */
export async function getCampaignById(campaignId) {
  try {
    logger.debug(`Fetching campaign ${campaignId}`);
    
    const response = await axios.get(
      `${CAMPAIGN_SERVICE_URL}/api/campaigns/${campaignId}`,
      { timeout: 5000 }
    );
    
    return response.data;
    
  } catch (error) {
    logger.error({ campaignId, error: error.message }, 'Error fetching campaign');
    return null;
  }
}
