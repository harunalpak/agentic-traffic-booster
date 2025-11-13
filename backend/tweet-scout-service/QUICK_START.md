# 🚀 Tweet Scout Service - Quick Start

## ⚡ 3-Minute Setup

### 1. Configure Twitter Credentials

Create `.env` file (or copy from `env.template`):

```bash
cp env.template .env
```

Edit `.env` and add your Twitter credentials:

```bash
TWITTER_USERNAME=your_actual_username
TWITTER_PASSWORD=your_actual_password
TWITTER_EMAIL=your_actual_email@example.com
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Service

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

## ✅ What You Get

✅ **Real Twitter scraping** instead of mock tweets  
✅ **Smart filtering** by time window and follower count  
✅ **Multiple search modes** (Top, Latest, Photos, Videos)  
✅ **Automatic fallback** to mock tweets if scraping fails  
✅ **Kafka integration** publishing to `new_tweets` topic  
✅ **Comprehensive logging** for monitoring  

## 🎯 How It Works

```
1. Service starts and authenticates with Twitter
2. Fetches active campaigns from Campaign Service
3. For each campaign:
   - Builds search query from hashtags/keywords
   - Scrapes tweets from Twitter
   - Filters by time (last 15 min by default)
   - Filters by follower count (min 100 by default)
   - Normalizes tweet format
   - Publishes to Kafka topic "new_tweets"
4. Social Engine Service picks up tweets
5. AI generates contextual replies
6. User approves/edits in dashboard
```

## 🔧 Configuration Options

### Environment Variables (`.env`)

```bash
# Twitter Authentication (REQUIRED)
TWITTER_USERNAME=<your_username>
TWITTER_PASSWORD=<your_password>
TWITTER_EMAIL=<your_email>

# Scraping Configuration
SCRAPE_INTERVAL_MINUTES=30      # How often to scrape
MAX_TWEETS_PER_CAMPAIGN=20      # Max tweets per campaign
USE_MOCK_TWEETS=true            # Fallback to mock if real fails

# Service Configuration
KAFKA_BROKERS=localhost:9092
CAMPAIGN_SERVICE_URL=http://localhost:8082
LOG_LEVEL=info
```

### Campaign Overrides

Campaigns can override defaults:

```json
{
  "searchMode": "LATEST",           # TOP, LATEST, PHOTOS, VIDEOS
  "minFollowerCount": 200,          # Override default (100)
  "recentWindowMinutes": 30,        # Override default (15)
  "dailyLimit": 50                  # Override default (20)
}
```

## 📊 Monitoring

Check logs for:
- ✅ Login success
- 📥 Tweets fetched
- ⏰ Tweets after time filter
- 👥 Tweets after follower filter
- 📤 Tweets published to Kafka

## 🚨 Troubleshooting

### No Tweets Found?
- Check Twitter credentials are correct
- Verify campaign has hashtags/keywords
- Try increasing `recentWindowMinutes`
- Lower `minFollowerCount` threshold

### Authentication Failed?
- Verify credentials in `.env`
- Check Twitter account is active
- Ensure no 2FA issues

### Rate Limited?
- Increase `SCRAPE_INTERVAL_MINUTES`
- Reduce `MAX_TWEETS_PER_CAMPAIGN`

## 📚 Full Documentation

- **[TWITTER_SCRAPING_GUIDE.md](./TWITTER_SCRAPING_GUIDE.md)** - Complete setup guide
- **[UPGRADE_SUMMARY.md](./UPGRADE_SUMMARY.md)** - Implementation details
- **[README.md](./README.md)** - Service architecture

## 🎉 You're Ready!

The service will now:
1. ✅ Scrape real tweets from Twitter
2. ✅ Filter by quality (followers, recency)
3. ✅ Publish to Kafka for AI reply generation
4. ✅ Fallback gracefully if issues occur

---

**Need Help?** Check the full documentation or logs for detailed information.

