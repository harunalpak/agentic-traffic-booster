# 🧪 Testing Tweet Scout Service

## Quick Test Options

### Option 1: Test with Mock Tweets (Easiest - No Twitter Account Needed)

This is the fastest way to test the service without needing Twitter credentials.

```bash
cd backend/tweet-scout-service

# Create .env with mock tweets enabled
cat > .env << EOF
KAFKA_BROKERS=localhost:9092
CAMPAIGN_SERVICE_URL=http://localhost:8082
SCRAPE_INTERVAL_MINUTES=1
MAX_TWEETS_PER_CAMPAIGN=5
USE_MOCK_TWEETS=true
RUN_ON_STARTUP=true
LOG_LEVEL=info
TWITTER_USERNAME=mock
TWITTER_PASSWORD=mock
TWITTER_EMAIL=mock@example.com
EOF

# Install dependencies if not already done
npm install

# Run the service
npm run dev
```

**Expected Output:**
```
✅ Tweet Scout Service Starting
📅 Scheduling tweet scout with cron: "*/1 * * * *"
🔍 Tweet Scout: Starting tweet discovery
📋 Processing 2 active campaigns
⚠️  Using mock tweets as fallback
🎭 Generated 5 mock tweets for campaign 1
✅ Published 5 tweets to Kafka
📊 Tweet Scout Summary:
   Total Tweets Published: 5
```

---

### Option 2: Test with Real Twitter Scraping

If you have Twitter credentials and want to test real scraping:

```bash
cd backend/tweet-scout-service

# Create .env with your real Twitter credentials
cat > .env << EOF
KAFKA_BROKERS=localhost:9092
CAMPAIGN_SERVICE_URL=http://localhost:8082
SCRAPE_INTERVAL_MINUTES=1
MAX_TWEETS_PER_CAMPAIGN=10
USE_MOCK_TWEETS=true
RUN_ON_STARTUP=true
LOG_LEVEL=info

# Your real Twitter credentials
TWITTER_USERNAME=your_actual_username
TWITTER_PASSWORD=your_actual_password
TWITTER_EMAIL=your_actual_email@example.com
EOF

# Run the service
npm run dev
```

**Expected Output:**
```
ℹ️  CycleTLS not available, using default fetch (still secure)
🔐 Initializing Twitter scraper with standard protection...
🔑 Logging into Twitter...
✅ Twitter login successful (with standard protection)
🚀 Initiating real Twitter scrape for campaign 1
   Query: "#handmade OR #jewelry"
   Search Mode: LATEST (1)
   Tweet Limit: 10
   🌐 Fetching tweets from Twitter...
   📥 Fetched 8 raw tweets
   ⏰ Time filter (last 15 min): 5 tweets
   👥 Fetching author profiles (min followers: 100)...
   ✅ Real scraping complete: 3 qualified tweets
```

---

## Prerequisites

### 1. Start Required Services

#### Start Kafka (Docker)
```bash
# Option A: Using Docker Compose (recommended)
docker-compose up -d kafka zookeeper

# Option B: Using standalone Kafka container
docker run -d \
  --name kafka \
  -p 9092:9092 \
  -e KAFKA_ENABLE_KRAFT=yes \
  apache/kafka:latest

# Verify Kafka is running
docker ps | grep kafka
```

#### Start Campaign Service
```bash
cd backend/campaign-service

# Make sure PostgreSQL is running
docker-compose up -d postgres

# Start the service
mvn spring-boot:run

# Or if already built
java -jar target/campaign-service.jar
```

**Verify Campaign Service:**
```bash
curl http://localhost:8082/api/campaigns
# Should return JSON array of campaigns
```

---

## Step-by-Step Testing Guide

### Step 1: Install Dependencies
```bash
cd backend/tweet-scout-service
npm install
```

### Step 2: Configure Environment
```bash
# Copy and edit the template
cp env.template .env
nano .env  # or use your preferred editor
```

### Step 3: Create Test Campaigns

Use the Campaign Service API to create test campaigns:

```bash
# Create a test campaign
curl -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Jewelry Campaign",
    "status": "ACTIVE",
    "mode": "SEMI_AUTO",
    "hashtags": ["#handmade", "#jewelry"],
    "keywords": ["artisan jewelry"],
    "searchMode": "LATEST",
    "minFollowerCount": 50,
    "recentWindowMinutes": 30,
    "dailyLimit": 10
  }'
```

### Step 4: Run Tweet Scout Service
```bash
npm run dev
```

### Step 5: Monitor Logs

Watch for these key log entries:

**✅ Successful Scraping:**
```
🔍 Tweet Scout: Starting tweet discovery
📋 Processing 1 active campaigns
📌 Campaign: Test Jewelry Campaign (ID: 1)
   Query: "#handmade OR #jewelry OR artisan jewelry"
   📨 Found 5 tweets
✅ Published 5 tweets to Kafka
```

**⚠️ Mock Fallback:**
```
⚠️  Real scraping failed, checking fallback options...
🔄 Using mock tweets as fallback
🎭 Generated 5 mock tweets for campaign 1
```

### Step 6: Verify Kafka Messages

Check that tweets are being published to Kafka:

```bash
# Using Kafka console consumer
kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic new_tweets \
  --from-beginning \
  --max-messages 10

# Or using docker
docker exec -it kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic new_tweets \
  --from-beginning
```

**Expected Message Format:**
```json
{
  "tweetId": "1234567890",
  "campaignId": 1,
  "author": "username",
  "text": "Check out these amazing handmade jewelry pieces! #handmade #jewelry",
  "createdAt": "2025-11-13T18:30:00.000Z",
  "link": "https://twitter.com/username/status/1234567890",
  "followers": 1250,
  "likes": 42,
  "retweets": 10,
  "replies": 5,
  "language": "en",
  "verified": false,
  "profileUrl": "https://twitter.com/username"
}
```

---

## Testing Different Scenarios

### Test 1: Mock Tweets (No Twitter Credentials)
```bash
# .env configuration
USE_MOCK_TWEETS=true
TWITTER_USERNAME=mock
TWITTER_PASSWORD=mock
TWITTER_EMAIL=mock@example.com

# Run
npm run dev
```

**Expected:** Service generates 5 mock tweets per campaign

---

### Test 2: Real Scraping with Fallback
```bash
# .env configuration
USE_MOCK_TWEETS=true  # Enable fallback
TWITTER_USERNAME=your_real_username
TWITTER_PASSWORD=your_real_password
TWITTER_EMAIL=your_real_email

# Run
npm run dev
```

**Expected:** 
- Tries real Twitter scraping first
- Falls back to mock if authentication fails

---

### Test 3: Real Scraping Only (Production Mode)
```bash
# .env configuration
USE_MOCK_TWEETS=false  # Disable fallback
TWITTER_USERNAME=your_real_username
TWITTER_PASSWORD=your_real_password
TWITTER_EMAIL=your_real_email

# Run
npm start
```

**Expected:** 
- Only real Twitter scraping
- Returns empty array if scraping fails (no mock fallback)

---

### Test 4: Different Search Modes

Create campaigns with different search modes:

```bash
# Test with TOP tweets
curl -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Top Tweets Campaign",
    "status": "ACTIVE",
    "searchMode": "TOP",
    "hashtags": ["#trending"]
  }'

# Test with PHOTOS only
curl -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Photos Campaign",
    "status": "ACTIVE",
    "searchMode": "PHOTOS",
    "hashtags": ["#photography"]
  }'
```

---

### Test 5: Time Window Filtering

Test with different time windows:

```bash
# Campaign with 5-minute window (very recent tweets only)
curl -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Recent Tweets Only",
    "status": "ACTIVE",
    "recentWindowMinutes": 5,
    "hashtags": ["#breaking"]
  }'

# Campaign with 60-minute window (broader search)
curl -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Last Hour Tweets",
    "status": "ACTIVE",
    "recentWindowMinutes": 60,
    "hashtags": ["#news"]
  }'
```

---

### Test 6: Follower Count Filtering

Test different follower thresholds:

```bash
# Only high-follower accounts (influencers)
curl -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Influencer Tweets",
    "status": "ACTIVE",
    "minFollowerCount": 10000,
    "hashtags": ["#fashion"]
  }'

# Allow smaller accounts
curl -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "All Accounts",
    "status": "ACTIVE",
    "minFollowerCount": 10,
    "hashtags": ["#smallbusiness"]
  }'
```

---

## Manual Testing Checklist

### ✅ Basic Functionality
- [ ] Service starts without errors
- [ ] Connects to Kafka successfully
- [ ] Fetches active campaigns from Campaign Service
- [ ] Generates/scrapes tweets
- [ ] Publishes tweets to Kafka
- [ ] Scheduler runs at configured interval

### ✅ Twitter Integration (if using real credentials)
- [ ] Twitter login successful
- [ ] Search queries work correctly
- [ ] Profile fetching works
- [ ] Follower count filtering works
- [ ] Session reuse works (check logs for "Reusing existing Twitter session")

### ✅ Filtering
- [ ] Time window filter works (only recent tweets)
- [ ] Follower count filter works (min threshold respected)
- [ ] Search mode selection works (TOP/LATEST/PHOTOS/VIDEOS)

### ✅ Error Handling
- [ ] Graceful handling of missing credentials
- [ ] Fallback to mock tweets when enabled
- [ ] Proper error logging
- [ ] No crashes on API errors

### ✅ Kafka Integration
- [ ] Messages published to `new_tweets` topic
- [ ] Message format is correct (JSON with all fields)
- [ ] Campaign ID included in messages
- [ ] Dead letter queue used for failures

---

## Automated Testing Script

Create a test script to verify everything:

```bash
#!/bin/bash
# test-tweet-scout.sh

echo "🧪 Testing Tweet Scout Service"
echo "================================"

# Test 1: Check service health
echo "Test 1: Service Health Check"
npm run dev &
SERVICE_PID=$!
sleep 5

if ps -p $SERVICE_PID > /dev/null; then
   echo "✅ Service started successfully"
else
   echo "❌ Service failed to start"
   exit 1
fi

# Test 2: Check Kafka connection
echo ""
echo "Test 2: Kafka Connection"
sleep 10
if docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092 | grep -q "new_tweets"; then
   echo "✅ Kafka topic exists"
else
   echo "⚠️  Kafka topic not found (will be created on first message)"
fi

# Test 3: Check for published messages
echo ""
echo "Test 3: Published Messages"
MESSAGE_COUNT=$(docker exec kafka kafka-run-class.sh kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 \
  --topic new_tweets \
  --time -1 | awk -F ":" '{sum += $3} END {print sum}')

if [ "$MESSAGE_COUNT" -gt 0 ]; then
   echo "✅ Found $MESSAGE_COUNT messages in Kafka"
else
   echo "⚠️  No messages found yet (may need more time)"
fi

# Cleanup
kill $SERVICE_PID
echo ""
echo "🎉 Testing complete!"
```

Run it:
```bash
chmod +x test-tweet-scout.sh
./test-tweet-scout.sh
```

---

## Troubleshooting Tests

### Issue: "Cannot connect to Kafka"
```bash
# Check if Kafka is running
docker ps | grep kafka

# Check Kafka logs
docker logs kafka

# Test Kafka connectivity
telnet localhost 9092
```

### Issue: "Cannot fetch campaigns"
```bash
# Check Campaign Service
curl http://localhost:8082/api/campaigns

# Check Campaign Service logs
cd backend/campaign-service
tail -f logs/application.log
```

### Issue: "Twitter authentication failed"
```bash
# Verify credentials in .env
cat .env | grep TWITTER_

# Test with mock tweets first
USE_MOCK_TWEETS=true npm run dev

# Check Twitter account status (not locked/suspended)
```

### Issue: "No tweets found"
```bash
# Check campaign configuration
curl http://localhost:8082/api/campaigns/1

# Try broader search criteria
# - More hashtags/keywords
# - Longer time window (recentWindowMinutes: 60)
# - Lower follower threshold (minFollowerCount: 10)

# Enable mock tweets as fallback
USE_MOCK_TWEETS=true npm run dev
```

### Issue: "Service crashes"
```bash
# Check Node.js version
node --version  # Should be 20+

# Check dependencies
npm install

# Check logs for specific errors
npm run dev 2>&1 | tee debug.log
```

---

## Performance Testing

### Load Test with Multiple Campaigns

```bash
# Create 10 test campaigns
for i in {1..10}; do
  curl -X POST http://localhost:8082/api/campaigns \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Test Campaign $i\",
      \"status\": \"ACTIVE\",
      \"hashtags\": [\"#test$i\"],
      \"keywords\": [\"test$i\"]
    }"
done

# Run service and monitor performance
npm run dev
```

Monitor:
- Processing time per campaign
- Total execution time
- Memory usage
- Kafka throughput

---

## Integration Testing with Social Engine

Test the complete flow:

```bash
# 1. Start all services
docker-compose up -d

# 2. Create a campaign
curl -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Integration Test",
    "status": "ACTIVE",
    "hashtags": ["#test"]
  }'

# 3. Watch tweet-scout logs
docker logs -f tweet-scout-service

# 4. Verify tweets in Kafka
docker exec kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic new_tweets

# 5. Check social-engine consumes tweets
docker logs -f social-engine-service
```

---

## Quick Test Commands

```bash
# Test with mock tweets (fastest)
USE_MOCK_TWEETS=true RUN_ON_STARTUP=true npm run dev

# Test real scraping
USE_MOCK_TWEETS=false npm run dev

# Test with debug logging
LOG_LEVEL=debug npm run dev

# Test single run (no scheduler)
SCRAPE_INTERVAL_MINUTES=99999 RUN_ON_STARTUP=true npm run dev
```

---

## Expected Test Results

### ✅ Successful Test Output

```
[INFO] 🚀 Tweet Scout Service Starting
[INFO] ℹ️  CycleTLS not available, using default fetch (still secure)
[INFO] 📅 Scheduling tweet scout with cron: "*/5 * * * *"
[INFO] ✅ Tweet Scout Scheduler initialized
[INFO] 🚀 Running initial scout on startup...
[INFO] ========================================
[INFO] 🔍 Tweet Scout: Starting tweet discovery
[INFO] ========================================
[INFO] 📋 Processing 2 active campaigns
[INFO] ----------------------------------------
[INFO] 📌 Campaign: Test Campaign (ID: 1)
[INFO]    Mode: SEMI_AUTO
[INFO]    Status: ACTIVE
[INFO]    Query: "#handmade OR #jewelry"
[INFO] 🚀 Initiating real Twitter scrape for campaign 1
[INFO]    📥 Fetched 12 raw tweets
[INFO]    ⏰ Time filter (last 15 min): 8 tweets
[INFO]    ✅ Real scraping complete: 5 qualified tweets
[INFO]    ✅ Published 5 tweets to Kafka
[INFO] ========================================
[INFO] 📊 Tweet Scout Summary:
[INFO]    Campaigns Processed: 2
[INFO]    Total Tweets Found: 12
[INFO]    Total Tweets Published: 5
[INFO] ========================================
```

---

## Need Help?

- Check logs: `npm run dev` (verbose output)
- Enable debug: `LOG_LEVEL=debug npm run dev`
- View full docs: `TWITTER_SCRAPING_GUIDE.md`
- Quick start: `QUICK_START.md`

**Happy Testing! 🎉**

