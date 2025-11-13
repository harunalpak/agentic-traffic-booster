/**
 * Search and Scraping Configuration
 * Defines default parameters for Twitter scraping
 */

// Twitter Search Mode Constants (numeric values required by twitter-scraper)
export const SEARCH_MODES = {
  TOP: 0,      // Top/best tweets
  LATEST: 1,   // Latest tweets
  PHOTOS: 2,   // Tweets with photos
  VIDEOS: 3    // Tweets with videos
};

// Default search configuration
export const CONFIG = {
  // Maximum number of tweets to fetch per scan
  maxTweetsPerScan: 100,
  
  // Time window for recent tweets (in minutes)
  // Only tweets within this window will be considered
  recentWindowMinutes: 180,  // 3 hours for testing
  
  // Minimum follower count for tweet authors
  minFollowers: 150000,
  
  // Default search mode (1 = Latest)
  searchMode: SEARCH_MODES.LATEST
};

/**
 * Resolve search mode from string to numeric constant
 * @param {string|number} mode - Search mode (string or number)
 * @returns {number} Numeric search mode constant
 */
export function resolveSearchMode(mode) {
  // If already a number, validate and return
  if (typeof mode === 'number') {
    return Object.values(SEARCH_MODES).includes(mode) ? mode : SEARCH_MODES.LATEST;
  }
  
  // Map string to numeric constant
  const modeMap = {
    'TOP': SEARCH_MODES.TOP,
    'LATEST': SEARCH_MODES.LATEST,
    'PHOTOS': SEARCH_MODES.PHOTOS,
    'VIDEOS': SEARCH_MODES.VIDEOS
  };
  
  const upperMode = String(mode || '').toUpperCase();
  return modeMap[upperMode] ?? SEARCH_MODES.LATEST;
}

/**
 * Get search mode name from numeric constant
 * @param {number} mode - Numeric search mode
 * @returns {string} Search mode name
 */
export function getSearchModeName(mode) {
  const modeNames = {
    [SEARCH_MODES.TOP]: 'TOP',
    [SEARCH_MODES.LATEST]: 'LATEST',
    [SEARCH_MODES.PHOTOS]: 'PHOTOS',
    [SEARCH_MODES.VIDEOS]: 'VIDEOS'
  };
  
  return modeNames[mode] || 'LATEST';
}

export default CONFIG;

