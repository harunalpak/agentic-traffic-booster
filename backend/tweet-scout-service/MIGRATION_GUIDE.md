# Migration Guide: TweetScout Refactoring

## 🔄 Overview

This guide explains the refactoring of TweetScout from the Java `social-engine-service` into an independent Node.js `tweet-scout-service`.

## 📊 Before & After Architecture

### Before (Monolithic Approach)

```
social-engine-service (Java - Port 8083)
├── @Scheduled TweetScoutScheduler
│   ├── Fetch campaigns
│   ├── Mock tweet generation
│   └── Kafka producer → new_tweets
├── ReplyGeneratorConsumer
│   └── Kafka consumer ← new_tweets
└── TaskConsumer
```

### After (Microservices Approach)

```
tweet-scout-service (Node.js - Standalone)
├── Cron scheduler (node-cron)
├── Twitter Scraper (@the-convocation)
├── Campaign client (axios)
└── Kafka producer (kafkajs) → new_tweets

social-engine-service (Java - Port 8083)
├── ReplyGeneratorConsumer (unchanged)
│   └── Kafka consumer ← new_tweets
└── TaskConsumer (unchanged)
```

## 🗑️ What Was Removed from social-engine-service

### Files Deleted

```
❌ src/main/java/com/atb/socialengine/scheduler/TweetScoutScheduler.java
```

### Code Removed

From `SocialEngineServiceApplication.java`:
```java
// No longer needed:
@EnableScheduling  // Can be removed if no other schedulers exist
```

From `pom.xml`:
```xml
<!-- No longer needed if not used elsewhere -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-scheduling</artifactId>
</dependency>
```

### Configuration Removed

From `application.yml`:
```yaml
# No longer needed:
tweet:
  scout:
    interval: 1800000
```

## ✅ What Remains in social-engine-service

### Unchanged Components

✅ **ReplyGeneratorConsumer** - Still consumes from `new_tweets`  
✅ **TaskConsumer** - Still processes replies  
✅ **All Services** - ChatGPT, ShortLink, etc.  
✅ **Kafka Configuration** - Topics and consumers  
✅ **REST API** - Task management endpoints  

### Updated Documentation

The README.md should be updated to reflect:

1. TweetScout is now a separate service
2. Remove references to tweet scouting scheduler
3. Add link to tweet-scout-service documentation

## 🚀 Deployment Changes

### Before

```bash
# Single service deployment
cd backend/social-engine-service
mvn spring-boot:run
```

### After

```bash
# Deploy two services

# 1. Tweet Scout Service
cd backend/tweet-scout-service
npm install
npm start

# 2. Social Engine Service
cd backend/social-engine-service
mvn spring-boot:run
```

### Docker Compose Changes

Create a unified `docker-compose.yml` that includes both services:

```yaml
version: '3.8'

services:
  # Shared infrastructure
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    # ... configuration ...

  # Node.js service
  tweet-scout-service:
    build: ./backend/tweet-scout-service
    environment:
      KAFKA_BROKERS: kafka:29092
      CAMPAIGN_SERVICE_URL: http://campaign-service:8082
  
  # Java service
  social-engine-service:
    build: ./backend/social-engine-service
    environment:
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:29092
```

## 🔧 Migration Steps

### 1. Install Node.js Service

```bash
cd backend/tweet-scout-service
npm install
```

### 2. Configure Environment

```bash
# tweet-scout-service/.env
KAFKA_BROKERS=localhost:9092
CAMPAIGN_SERVICE_URL=http://localhost:8082
SCRAPE_INTERVAL_MINUTES=30
USE_MOCK_TWEETS=false
RUN_ON_STARTUP=true
```

### 3. Update Java Service (Already Done)

The TweetScoutScheduler.java has already been removed.

### 4. Start Services in Order

```bash
# 1. Start Kafka
docker run -d -p 9092:9092 apache/kafka:latest

# 2. Start Campaign Service
cd backend/campaign-service
mvn spring-boot:run &

# 3. Start Tweet Scout Service
cd backend/tweet-scout-service
npm start &

# 4. Start Social Engine Service
cd backend/social-engine-service
mvn spring-boot:run &
```

### 5. Verify Communication

```bash
# Check Kafka messages
kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic new_tweets \
  --from-beginning

# Check social-engine-service logs
tail -f backend/social-engine-service/logs/application.log
```

## 📊 Benefits of This Refactoring

### 1. **Separation of Concerns**
- Tweet discovery is isolated
- Easier to maintain and test
- Independent deployment cycles

### 2. **Technology Optimization**
- Node.js for I/O-heavy scraping
- Better suited for Twitter Scraper library
- Java for complex business logic

### 3. **Scalability**
- Scale tweet scouting independently
- Different resource requirements
- No impact on reply generation

### 4. **Development Experience**
- Faster iteration on scraping logic
- No need to rebuild Java service
- Better logging and debugging

### 5. **Fault Isolation**
- Tweet scouting failures don't affect replies
- Independent restart and recovery
- Better error handling

## 🔄 Data Flow Verification

### Step 1: Tweet Scout publishes to Kafka

```bash
# In tweet-scout-service logs:
[INFO] ✅ Published 7 tweets to Kafka
```

### Step 2: Social Engine consumes from Kafka

```bash
# In social-engine-service logs:
[INFO] ReplyGenerator: Processing tweet mock_1234567890_0
```

### Step 3: Reply generated and task created

```bash
# In social-engine-service logs:
[INFO] TaskConsumer: Saved reply as task 42 in database
```

## 🧪 Testing Migration

### Test 1: Tweet Scout Running

```bash
cd backend/tweet-scout-service
npm start

# Expected: Service starts, scheduler initializes
```

### Test 2: Kafka Message Production

```bash
# Monitor Kafka
kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic new_tweets \
  --from-beginning

# Expected: Messages appear after scout runs
```

### Test 3: Social Engine Consumption

```bash
cd backend/social-engine-service
mvn spring-boot:run

# Expected: Logs show tweet processing
```

### Test 4: End-to-End Flow

```bash
# 1. Tweet Scout discovers tweets
# 2. Publishes to Kafka
# 3. Social Engine consumes
# 4. Generates reply with ChatGPT
# 5. Creates task in database

# Check database
psql -U postgres atb_social
SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5;
```

## 🚨 Rollback Plan

If issues occur, you can temporarily rollback:

### Option 1: Revert to Java Scheduler

1. Restore `TweetScoutScheduler.java`
2. Stop `tweet-scout-service`
3. Restart `social-engine-service`

### Option 2: Disable Tweet Scouting

```bash
# Stop tweet-scout-service
docker-compose stop tweet-scout-service

# Manually publish test messages if needed
```

## 📋 Checklist

Migration checklist:

- [x] Node.js service created and tested
- [x] Twitter Scraper integration working
- [x] Kafka producer functional
- [x] Campaign client communicating
- [x] Scheduler cron job running
- [x] Java service updated (scheduler removed)
- [x] Docker configuration updated
- [x] Documentation updated
- [ ] Environment variables configured
- [ ] Services deployed and tested
- [ ] End-to-end flow verified
- [ ] Monitoring and alerts configured

## 🎓 Key Learnings

1. **Microservices Pattern**: Each service has a single responsibility
2. **Event-Driven Architecture**: Services communicate via Kafka
3. **Technology Choice**: Use the right tool for each job
4. **Independent Deployment**: Services can be deployed separately
5. **Fault Tolerance**: Failures are isolated to individual services

## 📚 Additional Resources

- [Tweet Scout Service README](./README.md)
- [Tweet Scout Quick Start](./QUICKSTART.md)
- [Social Engine Service README](../social-engine-service/README.md)
- [Kafka Documentation](https://kafka.apache.org/documentation/)

---

**Migration Date:** November 2024  
**Status:** ✅ Complete  
**Impact:** Low (backward compatible via Kafka)
