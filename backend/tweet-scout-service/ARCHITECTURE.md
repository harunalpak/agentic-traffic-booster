# Tweet Scout Service - Architecture

## 🏗️ System Design

### Overview

The Tweet Scout Service is a **Node.js microservice** that autonomously discovers relevant tweets for active marketing campaigns and publishes them to Kafka for downstream processing.

### Why Node.js?

This service was **refactored from Java** to Node.js for several reasons:

1. **Better Library Support** - Native Twitter Scraper integration
2. **Simpler Implementation** - No subprocess complexity
3. **Event Loop Model** - Ideal for I/O-heavy operations
4. **Independent Deployment** - Can scale separately
5. **Right Tool for the Job** - Web scraping is a Node.js strength

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Tweet Scout Service                       │
│                        (Node.js)                             │
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐ │
│  │   Scheduler  │────▶│  Campaign    │────▶│   Tweet     │ │
│  │  (node-cron) │     │   Client     │     │  Scraper    │ │
│  └──────────────┘     └──────────────┘     └─────────────┘ │
│         │                     │                     │        │
│         │                     ▼                     ▼        │
│         │              HTTP Request          Twitter API     │
│         │         (campaign-service)        (Scraper Lib)    │
│         │                     │                     │        │
│         │                     ▼                     ▼        │
│         │              ┌──────────────────────────────┐     │
│         └─────────────▶│     Tweet Publisher        │     │
│                        │      (KafkaJS)              │     │
│                        └──────────────────────────────┘     │
│                                   │                          │
└───────────────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │     Kafka     │
                            │ Topic:        │
                            │ new_tweets    │
                            └───────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │  Social Engine Service│
                        │       (Java)          │
                        │  Reply Generator      │
                        └───────────────────────┘
```

## 🧩 Component Architecture

### 1. Scheduler Module (`scoutScheduler.js`)

**Responsibility**: Orchestrates the entire tweet discovery flow

**Key Functions**:
- `runScoutJob()` - Main execution function
- `startScheduler()` - Initializes cron job
- `stopScheduler()` - Graceful shutdown

**Flow**:
```javascript
1. Fetch active campaigns
2. For each campaign:
   a. Build search query
   b. Scrape tweets
   c. Publish to Kafka
3. Log summary statistics
```

**Cron Schedule**:
- Default: `*/30 * * * *` (every 30 minutes)
- Configurable via `SCRAPE_INTERVAL_MINUTES`

### 2. Campaign Client (`campaignClient.js`)

**Responsibility**: Communicate with campaign-service

**Endpoints**:
```
GET /api/campaigns?status=ACTIVE
GET /api/campaigns/{id}
```

**Functions**:
- `getActiveCampaigns()` - Fetch all active campaigns
- `getCampaignById(id)` - Fetch specific campaign
- `buildSearchQuery(campaign)` - Build Twitter search query

**Query Building Logic**:
```javascript
// Combines keywords and hashtags
campaign.keywords = ["handmade", "gifts"]
campaign.hashtags = ["#Christmas", "#DIY"]

// Result: "handmade OR gifts OR #Christmas OR #DIY"
```

### 3. Tweet Scraper (`tweetScraper.js`)

**Responsibility**: Discover tweets using Twitter Scraper

**Library**: `@the-convocation/twitter-scraper`

**Functions**:
- `scrapeTweets(query, limit)` - Basic scraping
- `scrapeTweetsWithRetry(query, limit, retries)` - With retry logic
- `closeScraper()` - Cleanup resources

**Features**:
- Retry mechanism (up to 3 attempts)
- Exponential backoff (2s, 4s, 6s)
- Error handling and logging
- Rate limiting

**Tweet Data Structure**:
```javascript
{
  tweetId: "1878383920",
  author: "JaneDoe",
  text: "Looking for handmade gifts...",
  url: "https://twitter.com/i/web/status/1878383920",
  likes: 5,
  retweets: 2,
  language: "en",
  createdAt: "2025-11-14T12:00:00Z"
}
```

### 4. Tweet Publisher (`tweetPublisher.js`)

**Responsibility**: Publish tweets to Kafka

**Functions**:
- `publishTweets(campaignId, tweets)` - Batch publish
- `publishTweet(campaignId, tweet)` - Single tweet
- `disconnectProducer()` - Graceful shutdown

**Kafka Configuration**:
```javascript
{
  clientId: 'tweet-scout-service',
  brokers: ['localhost:9092'],
  topic: 'new_tweets',
  key: tweet.tweetId,  // Kafka message key
  value: JSON.stringify(tweet)  // Kafka message value
}
```

**Message Format**:
```json
{
  "tweetId": "1878383920",
  "campaignId": 12,
  "author": "JaneDoe",
  "text": "...",
  "url": "...",
  "likes": 5,
  "retweets": 2,
  "language": "en",
  "createdAt": "2025-11-14T12:00:00Z"
}
```

### 5. Kafka Configuration (`kafka.js`)

**Responsibility**: Kafka client setup

**Features**:
- Producer configuration
- Topic initialization
- Connection management
- Error handling

**Topic Configuration**:
```javascript
{
  topic: 'new_tweets',
  numPartitions: 3,
  replicationFactor: 1
}
```

### 6. Logger (`logger.js`)

**Responsibility**: Structured logging

**Library**: Pino + pino-pretty

**Features**:
- Colored console output
- JSON structured logs (production)
- Log levels: trace, debug, info, warn, error, fatal
- Timestamp formatting

## 🔄 Data Flow

### Detailed Flow Diagram

```
[Cron Trigger] (every 30 min)
       │
       ▼
[Scheduler: runScoutJob()]
       │
       ├─► [Campaign Client]
       │        │
       │        └─► HTTP GET /api/campaigns?status=ACTIVE
       │                    │
       │                    ▼
       │            [Campaign Service Response]
       │            [{id:1, name:"Xmas", hashtags:[...]}]
       │
       ▼
[For Each Campaign]
       │
       ├─► [Build Search Query]
       │   "handmade OR #Christmas OR gifts"
       │
       ├─► [Tweet Scraper]
       │        │
       │        └─► Twitter Scraper Library
       │                    │
       │                    └─► [Twitter API/Web]
       │                              │
       │                              ▼
       │                    [Tweets Array]
       │                    [{id, author, text, ...}]
       │
       └─► [Tweet Publisher]
                │
                └─► Kafka Producer
                         │
                         └─► Topic: new_tweets
                                  │
                                  ▼
                         [Social Engine Service]
                         [Reply Generator Consumer]
```

## 🕒 Execution Timeline

```
T+0s:    Scheduler triggers runScoutJob()
T+1s:    Fetch active campaigns from campaign-service
T+2s:    Campaign 1: Build query "#handmade OR #Christmas"
T+2s:    Campaign 1: Start scraping tweets
T+5s:    Campaign 1: Found 8 tweets
T+5s:    Campaign 1: Publish to Kafka
T+6s:    Campaign 1: Complete ✅
T+8s:    Campaign 2: Start processing...
T+15s:   Campaign 2: Complete ✅
T+17s:   Campaign 3: Start processing...
T+22s:   Campaign 3: Complete ✅
T+22s:   Log summary statistics
T+22s:   Job complete, wait for next schedule
```

## 🧠 Design Decisions

### 1. Why Cron Instead of Continuous Polling?

**Decision**: Scheduled execution with cron

**Rationale**:
- Reduces API load on Twitter
- Avoids rate limiting
- More predictable resource usage
- Easier to monitor and debug

### 2. Why Batch Publishing to Kafka?

**Decision**: Batch publish all tweets per campaign

**Rationale**:
- Better performance (fewer round trips)
- Atomic operations
- Easier error handling
- Reduced network overhead

### 3. Why Separate Microservice?

**Decision**: Extract from Java service to Node.js

**Rationale**:
- Native library support (Twitter Scraper)
- Independent scaling
- Language optimization (Node.js for I/O)
- Reduced complexity in Java service
- Easier testing and deployment

### 4. Why KafkaJS Instead of Native Kafka Client?

**Decision**: Use KafkaJS library

**Rationale**:
- Well-maintained and popular
- Simple API
- Good documentation
- Production-ready
- Active community

## 🚀 Scaling Strategies

### Horizontal Scaling

**Multiple Instances**:
```bash
docker-compose up -d --scale tweet-scout-service=3
```

**Considerations**:
- All instances run the same schedule
- May scrape duplicate tweets
- Kafka handles deduplication via message keys
- Use leader election for single executor (future)

### Vertical Scaling

**Increase Resources**:
```yaml
MAX_TWEETS_PER_CAMPAIGN=50  # More tweets per campaign
SCRAPE_INTERVAL_MINUTES=15  # More frequent execution
```

**Hardware**:
- More CPU: Faster processing
- More Memory: Handle larger datasets
- More Network: Faster API calls

### Partitioning Strategy

**Kafka Topic Partitions**:
```
new_tweets:
  - Partition 0: Campaign IDs % 3 == 0
  - Partition 1: Campaign IDs % 3 == 1
  - Partition 2: Campaign IDs % 3 == 2
```

**Benefits**:
- Parallel consumption
- Load distribution
- Better throughput

## 🔐 Security Architecture

### API Communication

```
Tweet Scout ─────HTTP───────▶ Campaign Service
               (No Auth)      (Internal Network)
```

**Current**: HTTP without authentication  
**Production**: HTTPS + API key or JWT

### Kafka Security

```
Tweet Scout ─────PLAINTEXT───────▶ Kafka
              (No Encryption)
```

**Current**: Plaintext connection  
**Production**: SASL/SSL encryption

### Twitter Scraping

```
Tweet Scout ─────Scraper Lib───────▶ Twitter
              (Public Data Only)
```

**Security**:
- No authentication required
- Public data only
- Respects rate limits
- No personal data collection

## 📊 Monitoring & Observability

### Metrics (Future Implementation)

```javascript
// Prometheus metrics
tweets_discovered_total
tweets_published_total
campaigns_processed_total
scraping_duration_seconds
kafka_publish_errors_total
campaign_fetch_errors_total
```

### Health Checks

```javascript
GET /health
{
  "status": "UP",
  "scheduler": "running",
  "lastRun": "2024-11-12T10:00:00Z",
  "nextRun": "2024-11-12T10:30:00Z"
}
```

### Logging Levels

- **INFO**: Job start/stop, summary stats
- **DEBUG**: Detailed execution flow
- **WARN**: Recoverable errors, retries
- **ERROR**: Critical failures

## 🧪 Testing Strategy

### Unit Tests

```javascript
// Test individual functions
test('buildSearchQuery combines keywords and hashtags')
test('scrapeTweets returns valid tweet objects')
test('publishTweets sends to correct topic')
```

### Integration Tests

```javascript
// Test full flow
test('runScoutJob discovers and publishes tweets')
test('scheduler executes on schedule')
test('error handling and retries')
```

### End-to-End Tests

```
1. Start all services (Kafka, campaign-service, tweet-scout)
2. Create active campaign
3. Trigger scout job
4. Verify Kafka messages
5. Verify social-engine-service consumes messages
```

## 🔄 Future Enhancements

### Phase 2: Advanced Features

1. **Leader Election** - Single executor among multiple instances
2. **Duplicate Detection** - Filter already-scraped tweets
3. **Sentiment Analysis** - Filter tweets by sentiment score
4. **Geographic Filtering** - Target specific regions
5. **Language Detection** - Multi-language support

### Phase 3: Optimization

1. **Redis Caching** - Cache scraped tweet IDs
2. **Rate Limit Management** - Dynamic backoff
3. **Parallel Scraping** - Multiple campaigns simultaneously
4. **Batch Optimization** - Tune Kafka batch size

### Phase 4: Intelligence

1. **ML-based Relevance** - Score tweet relevance
2. **Trend Detection** - Identify trending topics
3. **Optimal Timing** - Schedule based on activity patterns
4. **Auto-scaling** - Scale based on campaign volume

## 📈 Performance Characteristics

### Throughput

- **Tweets per Campaign**: 10 (default)
- **Campaigns per Minute**: 3-5
- **Total Tweets per Job**: 30-50
- **Jobs per Hour**: 2 (every 30 min)

### Latency

- **Campaign Fetch**: ~100-500ms
- **Tweet Scraping**: ~2-5s per campaign
- **Kafka Publishing**: ~100-200ms
- **Total Job Duration**: ~10-30s

### Resource Usage

- **Memory**: 100-200MB
- **CPU**: 5-15% (during execution)
- **Network**: Moderate (HTTP + Kafka)
- **Disk**: Minimal (logs only)

---

**Architecture Version**: 1.0  
**Last Updated**: November 2024  
**Built with**: Node.js 20, KafkaJS, Twitter Scraper

