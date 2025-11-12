# Tweet Scout Service

**Autonomous Tweet Discovery Microservice for Agentic Traffic Booster**

## 🎯 Purpose

The Tweet Scout Service is a dedicated Node.js microservice that autonomously discovers relevant tweets for active marketing campaigns. It uses the Twitter Scraper to find public tweets matching campaign criteria and publishes them to Kafka for downstream processing.

## 🏗️ Architecture

### Refactored from Java to Node.js

**Before:** TweetScout was a scheduled component within `social-engine-service` (Java)

**After:** Independent microservice with dedicated responsibility

```
┌─────────────────────────────┐
│   Tweet Scout Service       │
│      (Node.js)              │
│                             │
│  ┌────────────────────┐    │
│  │ Cron Scheduler     │    │
│  │ (every 30 min)     │    │
│  └─────────┬──────────┘    │
│            │                │
│            ▼                │
│  ┌────────────────────┐    │
│  │ Campaign Client    │────┼──→ campaign-service
│  └─────────┬──────────┘    │        (HTTP)
│            │                │
│            ▼                │
│  ┌────────────────────┐    │
│  │ Twitter Scraper    │    │
│  │ (@the-convocation) │    │
│  └─────────┬──────────┘    │
│            │                │
│            ▼                │
│  ┌────────────────────┐    │
│  │ Kafka Producer     │────┼──→ new_tweets topic
│  └────────────────────┘    │        (Kafka)
│                             │
└─────────────────────────────┘
```

## 🧩 Core Components

### 1. Scheduler (`scoutScheduler.js`)
- Cron-based execution (configurable interval)
- Fetches active campaigns
- Orchestrates scraping and publishing
- Comprehensive logging and error handling

### 2. Campaign Client (`campaignClient.js`)
- HTTP client to fetch active campaigns
- Communicates with `campaign-service`
- Error handling and retry logic

### 3. Tweet Scraper (`tweetScraper.js`)
- Uses `@the-convocation/twitter-scraper`
- Builds search queries from hashtags/keywords
- Mock tweet generation for development
- Rate limiting and error handling

### 4. Tweet Publisher (`tweetPublisher.js`)
- Kafka producer using `kafkajs`
- Batch message publishing
- Dead letter queue for failures
- Message key based on tweet ID

### 5. Kafka Configuration (`kafka.js`)
- Kafka client setup
- Topic definitions
- Producer connection management
- Graceful shutdown

## 📊 Data Flow

```
1. Cron Trigger (every 30 min)
   ↓
2. Fetch Active Campaigns
   ← campaign-service (HTTP GET)
   ↓
3. For Each Campaign:
   ├─ Build search query
   ├─ Scrape tweets
   └─ Publish to Kafka
      ↓
4. Kafka Topic: new_tweets
   ↓
5. Consumed by: social-engine-service
```

## 📡 Kafka Topics

### Published Topics

#### `new_tweets`
Messages published to this topic:

```json
{
  "tweetId": "1878383920",
  "campaignId": 12,
  "author": "JaneDoe",
  "text": "Any handmade Christmas ideas?",
  "url": "https://twitter.com/JaneDoe/status/1878383920",
  "likes": 42,
  "retweets": 7,
  "replies": 3,
  "language": "en",
  "createdAt": "2025-11-14T12:00:00.000Z"
}
```

#### `dead_letter`
Failed messages sent to DLQ:

```json
{
  "campaignId": 12,
  "tweets": [...],
  "error": "Error message",
  "timestamp": "2025-11-14T12:00:00.000Z",
  "service": "tweet-scout-service"
}
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Kafka 3.x
- Campaign Service running on port 8082

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp env.template .env

# Edit .env with your configuration
nano .env
```

### Configuration

Required environment variables:

```bash
KAFKA_BROKERS=localhost:9092
CAMPAIGN_SERVICE_URL=http://localhost:8082
SCRAPE_INTERVAL_MINUTES=30
MAX_TWEETS_PER_CAMPAIGN=10
```

### Run Locally

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### Run with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f tweet-scout-service

# Stop services
docker-compose down
```

## 📋 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KAFKA_BROKERS` | Kafka broker addresses | `localhost:9092` |
| `CAMPAIGN_SERVICE_URL` | Campaign service URL | `http://localhost:8082` |
| `SCRAPE_INTERVAL_MINUTES` | Scout execution interval | `30` |
| `MAX_TWEETS_PER_CAMPAIGN` | Max tweets per campaign | `10` |
| `USE_MOCK_TWEETS` | Use mock data if scraping fails | `false` |
| `RUN_ON_STARTUP` | Run scout on service startup | `true` |
| `LOG_LEVEL` | Logging level | `info` |
| `NODE_ENV` | Environment | `development` |
| `TZ` | Timezone for scheduler | `UTC` |

## 📝 Example Logs

```
[INFO] ========================================
[INFO] 🔍 Tweet Scout: Starting tweet discovery
[INFO] ========================================
[INFO] 📡 Fetching active campaigns from: http://localhost:8082
[INFO] ✅ Retrieved 3 active campaigns
[INFO] 📋 Processing 3 active campaigns
[INFO] ----------------------------------------
[INFO] 📌 Campaign: Handmade Xmas (ID: 1)
[INFO]    Mode: SEMI_AUTO
[INFO]    Status: ACTIVE
[INFO]    Query: "#handmade OR #Christmas OR #gifts"
[INFO] 🔍 Scraping tweets for query: "#handmade OR #Christmas OR #gifts" (limit: 10)
[INFO] ✅ Found 7 tweets
[INFO] 📨 Found 7 tweets
[INFO] ✅ Published 7 tweets to Kafka
[INFO] ========================================
[INFO] 📊 Tweet Scout Summary:
[INFO]    Campaigns Processed: 3
[INFO]    Campaigns Failed: 0
[INFO]    Total Tweets Found: 18
[INFO]    Total Tweets Published: 18
[INFO]    Duration: 12.45s
[INFO] ========================================
[INFO] ⏰ Next execution in 30 minutes
[INFO] ========================================
```

## 🧪 Testing

### Mock Tweet Mode

For development without Twitter access:

```bash
# In .env
USE_MOCK_TWEETS=true
RUN_ON_STARTUP=true
SCRAPE_INTERVAL_MINUTES=5
```

This will generate mock tweets for testing the pipeline.

### Kafka Testing

Monitor messages in Kafka:

```bash
# Watch new_tweets topic
kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic new_tweets \
  --from-beginning \
  --property print.key=true
```

## 📊 Performance

### Throughput
- **Campaigns per minute:** ~10-20 (depends on tweet scraping)
- **Tweets per campaign:** Configurable (default: 10)
- **Total tweets per run:** ~50-200

### Resource Usage
- **Memory:** ~100-200MB
- **CPU:** Low (mostly I/O bound)
- **Network:** Moderate (HTTP + Kafka)

### Scalability
- Single instance sufficient for most use cases
- Can scale horizontally for higher load
- Kafka producer handles batching efficiently

## 🔐 Security Considerations

### Current Implementation
- ✅ Non-root Docker user
- ✅ Environment-based configuration
- ✅ Error handling with DLQ

### Production Recommendations
- [ ] Use Twitter API credentials securely
- [ ] Implement rate limiting
- [ ] Add authentication for inter-service communication
- [ ] Use secrets manager for sensitive data
- [ ] Enable Kafka SSL/SASL
- [ ] Implement monitoring and alerting

## 🛠️ Troubleshooting

### Service won't start

```bash
# Check if Kafka is running
docker ps | grep kafka

# Check logs
docker-compose logs tweet-scout-service
```

### No tweets found

```bash
# Enable mock tweets for testing
USE_MOCK_TWEETS=true

# Check campaign service
curl http://localhost:8082/api/campaigns
```

### Kafka connection failed

```bash
# Check Kafka brokers
kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# Verify topic exists
kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### Campaign service unreachable

```bash
# Test connection
curl http://localhost:8082/api/campaigns

# Check Docker network
docker network inspect tweet-scout-network
```

## 🔄 Migration from Java

### What was removed from social-engine-service

❌ `TweetScoutScheduler.java` - Deleted  
❌ `searchTwitter()` method - Removed  
❌ `searchTwitterViaNodeScript()` - Removed  
❌ `@Scheduled` annotation - No longer needed  

### What remains in social-engine-service

✅ Kafka consumer for `new_tweets` topic  
✅ ReplyGenerator module  
✅ TaskManager module  
✅ All other services  

## 📚 Related Services

- **campaign-service** (Port 8082) - Campaign management
- **social-engine-service** (Port 8083) - Reply generation & task management
- **product-service** (Port 8080) - Product catalog

## 🚀 Future Enhancements

1. **Twitter API v2 Integration** - Official API support
2. **Real-time Streaming** - Twitter streaming API
3. **Advanced Filtering** - Sentiment analysis, language detection
4. **Rate Limiting** - Respect Twitter rate limits
5. **Caching** - Redis for tweet deduplication
6. **Metrics** - Prometheus metrics export
7. **Dashboard** - Real-time monitoring UI
8. **Multi-platform** - Support for other social networks

## 📄 License

Part of the Agentic Traffic Booster project.

## 👥 Contact

For questions or issues, refer to the main ATB project documentation.

---

**Built with:** Node.js 20, @the-convocation/twitter-scraper, kafkajs, node-cron

**Version:** 1.0.0

**Last Updated:** November 2024
