# Tweet Scout Service - Quick Start

## 🚀 Get Running in 3 Minutes

### Step 1: Prerequisites (30 seconds)

✅ Node.js 20+  
✅ Kafka running on port 9092  
✅ Campaign Service running on port 8082  

### Step 2: Install Dependencies (1 min)

```bash
cd backend/tweet-scout-service

# Install packages
npm install
```

### Step 3: Configure (30 seconds)

```bash
# Copy environment template (already exists in your project)
# Edit if needed, or use defaults:
echo "KAFKA_BROKERS=localhost:9092" > .env
echo "CAMPAIGN_SERVICE_URL=http://localhost:8082" >> .env
echo "SCRAPE_INTERVAL_MINUTES=5" >> .env
echo "USE_MOCK_TWEETS=true" >> .env
echo "RUN_ON_STARTUP=true" >> .env
```

### Step 4: Run (1 min)

```bash
# Development mode (auto-reload)
npm run dev

# Or production mode
npm start
```

### Step 5: Verify (30 seconds)

You should see logs like:

```
[INFO] 🚀 Tweet Scout Service Starting
[INFO] ========================================
[INFO] 📅 Scheduling tweet scout with cron: "*/5 * * * *"
[INFO] ✅ Tweet Scout Scheduler initialized
[INFO] 🚀 Running initial scout on startup...
[INFO] 🔍 Tweet Scout: Starting tweet discovery
[INFO] ✅ Retrieved 3 active campaigns
[INFO] ✅ Published 7 tweets to Kafka
```

## 🐳 Docker Quick Start (Alternative)

```bash
# Start everything with Docker
docker-compose up -d

# View logs
docker-compose logs -f tweet-scout-service

# Stop
docker-compose down
```

## ✅ Success Indicators

✅ Service starts without errors  
✅ Kafka connection established  
✅ Active campaigns fetched  
✅ Tweets published to Kafka topic `new_tweets`  
✅ Scheduler running (check logs)  

## 🔍 Check Kafka Messages

```bash
# Monitor new_tweets topic
kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic new_tweets \
  --from-beginning
```

## 🎯 Next Steps

1. ✅ Service is running
2. Configure social-engine-service to consume from `new_tweets`
3. Monitor logs for tweet discovery
4. Adjust `SCRAPE_INTERVAL_MINUTES` as needed
5. Switch `USE_MOCK_TWEETS=false` when ready for real scraping

## 🛑 Common Issues

### "Cannot connect to campaign-service"

```bash
# Fix: Start campaign-service
cd backend/campaign-service
mvn spring-boot:run
```

### "Kafka connection failed"

```bash
# Fix: Start Kafka
docker run -d -p 9092:9092 apache/kafka:latest
```

### "No tweets found"

```bash
# Fix: Enable mock tweets
USE_MOCK_TWEETS=true npm start
```

That's it! 🎊
