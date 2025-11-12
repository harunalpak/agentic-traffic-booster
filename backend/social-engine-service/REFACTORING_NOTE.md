# Social Engine Service - Refactoring Note

## 🔄 Important Architectural Change

### Tweet Scout Functionality Extracted

As of **November 2024**, the tweet discovery functionality has been **refactored into a separate microservice**.

### What Changed?

**Before**:
```
social-engine-service (Java)
├── TweetScoutScheduler    ← Tweet discovery (REMOVED)
├── ReplyGenerator         ← Reply generation
└── TaskManager            ← Task persistence
```

**After**:
```
tweet-scout-service (Node.js)
└── Tweet discovery         ← NEW MICROSERVICE

social-engine-service (Java)
├── ReplyGenerator         ← Reply generation (unchanged)
└── TaskManager            ← Task persistence (unchanged)
```

### Why the Change?

1. **Better Library Support** - Native Node.js Twitter Scraper integration
2. **Separation of Concerns** - Each service has a single responsibility
3. **Independent Scaling** - Scale tweet discovery separately from reply generation
4. **Language Optimization** - Node.js is better suited for web scraping
5. **Simpler Codebase** - Reduced complexity in Java service

### What Was Removed?

#### Deleted Files
- `src/main/java/com/atb/socialengine/scheduler/TweetScoutScheduler.java` ❌

#### Modified Files
- `SocialEngineServiceApplication.java` - Removed `@EnableScheduling` annotation
- Updated JavaDoc to reflect new architecture

### Updated Architecture

```
┌───────────────────────┐
│ tweet-scout-service   │ (Node.js)
│ - Discovers tweets    │
│ - Twitter Scraper     │
└───────────┬───────────┘
            │
            │ Kafka: new_tweets
            ▼
┌───────────────────────┐
│ social-engine-service │ (Java)
│ - Consumes tweets     │
│ - Generates replies   │
│ - Creates tasks       │
└───────────────────────┘
```

### How It Works Now

1. **tweet-scout-service** (Node.js):
   - Runs every 30 minutes
   - Fetches active campaigns
   - Searches Twitter for relevant tweets
   - Publishes to Kafka topic `new_tweets`

2. **social-engine-service** (Java):
   - Consumes from Kafka topic `new_tweets`
   - Generates AI-powered replies
   - Creates tasks for review/approval

### Migration Instructions

If you're updating from an older version:

1. **Deploy tweet-scout-service**:
   ```bash
   cd backend/tweet-scout-service
   npm install
   npm start
   ```

2. **Update social-engine-service**:
   ```bash
   cd backend/social-engine-service
   mvn clean package
   java -jar target/social-engine-service-1.0.0.jar
   ```

3. **Verify Integration**:
   ```bash
   # Check Kafka messages
   kafka-console-consumer.sh \
     --bootstrap-server localhost:9092 \
     --topic new_tweets \
     --from-beginning
   ```

### Documentation

For detailed information, see:

- **tweet-scout-service/README.md** - Node.js service documentation
- **tweet-scout-service/MIGRATION_GUIDE.md** - Detailed migration guide
- **tweet-scout-service/ARCHITECTURE.md** - Technical architecture

### Configuration Changes

#### No Longer Needed in social-engine-service

```yaml
# OLD configuration (remove if present)
tweet:
  scout:
    interval: 1800000
```

#### New Configuration in tweet-scout-service

```env
# NEW configuration
KAFKA_BROKERS=localhost:9092
CAMPAIGN_SERVICE_URL=http://localhost:8082
SCRAPE_INTERVAL_MINUTES=30
MAX_TWEETS_PER_CAMPAIGN=10
```

### Service Responsibilities (Updated)

#### social-engine-service (Java)
- ✅ Consume discovered tweets from Kafka
- ✅ Generate AI-powered replies using ChatGPT
- ✅ Create short links for products
- ✅ Persist tasks for manual/automatic posting
- ✅ Provide REST API for task management
- ❌ ~~Tweet discovery (moved to tweet-scout-service)~~

#### tweet-scout-service (Node.js)
- ✅ Discover relevant tweets for active campaigns
- ✅ Integrate with Twitter Scraper
- ✅ Publish discovered tweets to Kafka
- ✅ Schedule periodic execution

### Benefits of This Change

✅ **Cleaner Architecture** - Single Responsibility Principle  
✅ **Better Performance** - Optimized for each task  
✅ **Independent Deployment** - Deploy services separately  
✅ **Easier Scaling** - Scale based on specific needs  
✅ **Technology Choice** - Use best language for each task  
✅ **Simpler Testing** - Test services independently  

### Questions?

Refer to the migration guide or architecture documentation:
- `backend/tweet-scout-service/MIGRATION_GUIDE.md`
- `backend/tweet-scout-service/ARCHITECTURE.md`

---

**Refactoring Date**: November 2024  
**Version**: 2.0.0  
**Status**: ✅ Complete

