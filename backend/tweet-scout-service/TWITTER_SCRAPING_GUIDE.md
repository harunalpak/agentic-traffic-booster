# Real Twitter Scraping Guide

## 🚀 Overview

The Tweet Scout Service has been upgraded to use **real Twitter scraping** with anti-bot protection. This guide explains how to configure and use the new functionality.

## ✨ Features

- ✅ Real Twitter authentication and login
- ✅ Optional CycleTLS for enhanced anti-bot protection (auto-detected)
- ✅ Support for multiple search modes (Top, Latest, Photos, Videos)
- ✅ Time-window filtering (e.g., last 15 minutes)
- ✅ Follower-count filtering
- ✅ Automatic fallback to mock tweets if scraping fails
- ✅ Session reuse for better performance
- ✅ Comprehensive logging
- ✅ Fully compatible with existing microservice architecture

## 🔐 Setup & Configuration

### 1. Twitter Credentials

Create a `.env` file based on `env.template` and add your Twitter credentials:

```bash
TWITTER_USERNAME=your_actual_twitter_username
TWITTER_PASSWORD=your_actual_twitter_password
TWITTER_EMAIL=your_actual_email@example.com
```

**Important:** 
- Use a dedicated Twitter account for scraping
- Never commit `.env` file to version control
- If credentials are missing or invalid, the service will fall back to mock tweets

### 2. Scraping Configuration

Configure scraping parameters in `.env`:

```bash
# How often to scrape (in minutes)
SCRAPE_INTERVAL_MINUTES=30

# Maximum tweets per campaign per run
MAX_TWEETS_PER_CAMPAIGN=20

# Enable mock tweets as fallback
USE_MOCK_TWEETS=true

# Run immediately on startup
RUN_ON_STARTUP=false
```

### 3. Search Configuration

Default values are set in `src/config/search.config.js`:

```javascript
{
  maxTweetsPerScan: 20,        // Max tweets to fetch
  recentWindowMinutes: 15,      // Time window filter
  minFollowers: 100,            // Min follower count
  searchMode: SEARCH_MODES.LATEST  // Default search mode
}
```

Campaign-specific overrides:
- `campaign.dailyLimit` - Override max tweets
- `campaign.recentWindowMinutes` - Override time window
- `campaign.minFollowerCount` - Override follower filter
- `campaign.searchMode` - Override search mode

## 🔍 Search Modes

The service supports 4 numeric search modes:

| Mode | Value | Description |
|------|-------|-------------|
| `TOP` | 0 | Top/best tweets with high engagement |
| `LATEST` | 1 | Most recent tweets (default) |
| `PHOTOS` | 2 | Tweets containing photos |
| `VIDEOS` | 3 | Tweets containing videos |

**Usage in Campaign:**

```json
{
  "id": 1,
  "name": "Handmade Jewelry Campaign",
  "searchMode": "LATEST",
  "hashtags": ["#handmade", "#jewelry"],
  "keywords": ["artisan jewelry"],
  "minFollowerCount": 200,
  "recentWindowMinutes": 15,
  "dailyLimit": 20
}
```

The service automatically converts string modes to numeric constants.

## 📊 Scraping Workflow

### Step-by-Step Process

1. **Authentication**
   - Initializes Twitter scraper with CycleTLS
   - Logs in using provided credentials
   - Reuses session for subsequent requests

2. **Query Building**
   - Combines hashtags and keywords from campaign
   - Uses OR logic for broader search results
   - Falls back to campaign name if no hashtags/keywords

3. **Real Scraping**
   - Searches Twitter with specified mode and limit
   - Fetches raw tweets matching the query

4. **Time Filtering**
   - Filters tweets by `recentWindowMinutes`
   - Only keeps tweets within the time window
   - Default: last 15 minutes

5. **Follower Filtering**
   - Fetches profile for each tweet author
   - Checks follower count
   - Filters out authors below minimum threshold

6. **Normalization**
   - Converts tweets to standard format
   - Adds campaign ID
   - Includes engagement metrics

7. **Publishing**
   - Sends normalized tweets to Kafka
   - Topic: `new_tweets`
   - Social Engine Service picks them up for reply generation

## 📡 Tweet Object Format

After normalization, tweets have this structure:

```javascript
{
  tweetId: "1234567890",           // Twitter tweet ID
  campaignId: 1,                   // Campaign ID
  author: "username",              // Twitter username
  text: "Tweet content...",        // Full tweet text
  createdAt: "2025-01-01T12:00:00Z", // ISO timestamp
  link: "https://twitter.com/...", // Permanent URL
  followers: 1500,                 // Author follower count
  likes: 42,                       // Like count
  retweets: 10,                    // Retweet count
  replies: 5,                      // Reply count
  language: "en",                  // Tweet language
  verified: false,                 // Author verification status
  profileUrl: "https://twitter.com/username"
}
```

## 🔄 Fallback Mechanism

If real scraping fails, the service automatically falls back to mock tweets when `USE_MOCK_TWEETS=true`.

**Fallback Triggers:**
- Missing Twitter credentials
- Authentication failure
- Network errors
- Rate limiting
- API errors

**Mock Tweet Behavior:**
- Generates 5 realistic mock tweets
- Includes campaign ID and query
- Uses reasonable engagement metrics
- Timestamps spaced 10 minutes apart

## 📈 Logging & Monitoring

The service provides comprehensive logging at each step:

```
🔐 Initializing Twitter scraper with CycleTLS...
🔑 Logging into Twitter...
✅ Twitter login successful (CycleTLS enabled)
🔍 Starting real Twitter scrape for campaign 1
   Query: "#handmade OR #jewelry OR artisan jewelry"
   Search Mode: LATEST (1)
   Tweet Limit: 20
   🌐 Fetching tweets from Twitter...
   📥 Fetched 18 raw tweets
   ⏰ Time filter (last 15 min): 12 tweets
   👥 Fetching author profiles (min followers: 200)...
   ✅ Real scraping complete: 8 qualified tweets
   ⏱️  Duration: 12.34s
   📊 Filtering Summary:
      Raw tweets: 18
      After time filter: 12
      After follower filter: 8
```

## 🛠️ Development & Testing

### Installing Dependencies

```bash
cd backend/tweet-scout-service
npm install
```

This will install:
- `@the-convocation/twitter-scraper` - Twitter scraping library (required)
- `cycletls` - Enhanced anti-bot protection (optional, auto-detected)

**Note:** CycleTLS is an optional dependency. The service will work with or without it. When available, it provides enhanced anti-bot protection. The service automatically detects and uses it if installed.

### Running Locally

```bash
# Copy environment template
cp env.template .env

# Edit .env with your Twitter credentials
nano .env

# Start the service
npm start

# Or with auto-reload during development
npm run dev
```

### Testing with Mock Tweets

For development without Twitter credentials:

```bash
USE_MOCK_TWEETS=true
RUN_ON_STARTUP=true
```

## 🚨 Troubleshooting

### Authentication Errors

```
❌ Missing Twitter credentials
```

**Solution:** Ensure all three credentials are set in `.env`:
- `TWITTER_USERNAME`
- `TWITTER_PASSWORD`
- `TWITTER_EMAIL`

### Rate Limiting

```
❌ Real scraping error: Rate limit exceeded
```

**Solution:** 
- Increase `SCRAPE_INTERVAL_MINUTES`
- Reduce `MAX_TWEETS_PER_CAMPAIGN`
- Wait before retrying

### Empty Results

```
📭 No tweets within time window
```

**Solution:**
- Increase `recentWindowMinutes` in campaign config
- Broaden search query (more hashtags/keywords)
- Try different search modes (TOP vs LATEST)

### Profile Fetch Failures

```
⚠️ Failed to fetch profile for @username
```

**Solution:**
- This is usually harmless (accounts may be protected/deleted)
- The service skips these tweets and continues
- Check if specific usernames are consistently failing

## 📋 Best Practices

1. **Credentials**
   - Use a dedicated Twitter account
   - Enable 2FA but use app-specific passwords
   - Rotate credentials periodically

2. **Rate Limiting**
   - Start with longer intervals (30+ minutes)
   - Monitor for rate limit errors
   - Adjust based on campaign needs

3. **Search Queries**
   - Use specific hashtags for better targeting
   - Combine hashtags with keywords
   - Test queries on Twitter first

4. **Filtering**
   - Set realistic follower thresholds
   - Balance time window with tweet volume
   - Adjust based on niche (popular vs niche topics)

5. **Monitoring**
   - Watch logs for errors
   - Track success rates
   - Monitor Kafka topic for published tweets

## 🔗 Integration Flow

```
Campaign Service
    ↓ (Active Campaigns)
Tweet Scout Service
    ↓ (Real Twitter Scraping)
Kafka (new_tweets topic)
    ↓ (Consume Tweets)
Social Engine Service
    ↓ (AI Reply Generation)
Kafka (generated_replies topic)
    ↓
User Dashboard (Approval)
```

## 🎯 Production Deployment

### Environment Variables Checklist

- ✅ `TWITTER_USERNAME` - Set
- ✅ `TWITTER_PASSWORD` - Set
- ✅ `TWITTER_EMAIL` - Set
- ✅ `KAFKA_BROKERS` - Configured
- ✅ `CAMPAIGN_SERVICE_URL` - Configured
- ✅ `SCRAPE_INTERVAL_MINUTES` - Optimized
- ✅ `USE_MOCK_TWEETS` - false (production)
- ✅ `LOG_LEVEL` - info or warn

### Docker Deployment

The service runs in Docker with other microservices:

```bash
docker-compose up tweet-scout-service
```

Ensure credentials are passed via environment or secrets.

## 📚 Additional Resources

- [Twitter Scraper Library](https://github.com/the-convocation/twitter-scraper)
- [CycleTLS Documentation](https://github.com/Danny-Dasilva/CycleTLS)
- [Campaign Service API](../campaign-service/README.md)
- [Social Engine Integration](../social-engine-service/README.md)

## 🆘 Support

If you encounter issues:

1. Check logs in `logs/` directory
2. Verify Twitter credentials
3. Test with mock tweets first
4. Review Kafka connectivity
5. Check campaign service availability

---

**Status:** ✅ Production Ready

**Last Updated:** November 2025

**Version:** 2.0.0 (Real Twitter Scraping)

