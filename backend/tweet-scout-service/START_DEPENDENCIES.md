# 🚀 Starting Required Services for Tweet Scout Testing

## Quick Start - Just the Dependencies

You need 3 services running before testing tweet-scout-service:
1. **Kafka** (with Zookeeper)
2. **PostgreSQL**
3. **Campaign Service**

---

## Option 1: Docker Compose (Recommended - Easiest) ⭐

### Start Only Required Services

From the project root directory:

```bash
cd C:\Projects\Cursor\agentic-traffic-booster

# Start just the dependencies (not tweet-scout-service itself)
docker-compose up -d zookeeper kafka postgres campaign-service
```

**Wait for services to be healthy (~30 seconds):**
```bash
# Check status
docker-compose ps

# You should see:
# atb-zookeeper     running
# atb-kafka         running (healthy)
# atb-postgres      running (healthy)
# atb-campaign-service  running
```

**Verify they're working:**
```bash
# Test Kafka
docker exec atb-kafka kafka-topics --list --bootstrap-server localhost:9092

# Test PostgreSQL
docker exec atb-postgres pg_isready -U postgres

# Test Campaign Service
curl http://localhost:8082/api/campaigns
# Should return: [] or list of campaigns
```

### Now Run Tweet Scout Service Locally

```bash
cd backend/tweet-scout-service

# Create .env file
cat > .env << EOF
KAFKA_BROKERS=localhost:9092
CAMPAIGN_SERVICE_URL=http://localhost:8082
USE_MOCK_TWEETS=true
RUN_ON_STARTUP=true
SCRAPE_INTERVAL_MINUTES=1
MAX_TWEETS_PER_CAMPAIGN=5
LOG_LEVEL=info
TWITTER_USERNAME=mock
TWITTER_PASSWORD=mock
TWITTER_EMAIL=mock@example.com
EOF

# Install and run
npm install
npm run dev
```

### Stop Services When Done

```bash
# Stop dependencies
docker-compose down

# Or keep data and just stop
docker-compose stop
```

---

## Option 2: Start Each Service Manually

If you want more control or don't want to use Docker for everything:

### 1. Start Kafka + Zookeeper (Docker)

```bash
cd C:\Projects\Cursor\agentic-traffic-booster

# Start only Kafka and Zookeeper
docker-compose up -d zookeeper kafka

# Wait for Kafka to be ready (~15 seconds)
docker-compose logs -f kafka
# Wait until you see: "Kafka Server started"
```

### 2. Start PostgreSQL (Docker)

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Verify it's running
docker exec atb-postgres pg_isready -U postgres
# Should output: accepting connections
```

### 3. Start Campaign Service (Local Java)

```bash
cd backend/campaign-service

# Make sure you have application.properties configured
# Should have:
# spring.datasource.url=jdbc:postgresql://localhost:5432/atb_social
# spring.datasource.username=postgres
# spring.datasource.password=postgres
# spring.kafka.bootstrap-servers=localhost:9092

# Run with Maven
mvn clean spring-boot:run

# Or if already built
java -jar target/campaign-service-*.jar
```

**Verify Campaign Service:**
```bash
curl http://localhost:8082/api/campaigns
# Should return JSON response
```

### 4. Run Tweet Scout Service

```bash
cd backend/tweet-scout-service

# Create .env
cat > .env << EOF
KAFKA_BROKERS=localhost:9092
CAMPAIGN_SERVICE_URL=http://localhost:8082
USE_MOCK_TWEETS=true
RUN_ON_STARTUP=true
SCRAPE_INTERVAL_MINUTES=1
LOG_LEVEL=info
TWITTER_USERNAME=mock
TWITTER_PASSWORD=mock
TWITTER_EMAIL=mock@example.com
EOF

# Run
npm run dev
```

---

## Option 3: All-in-One Docker Setup

Start everything including tweet-scout-service:

```bash
cd C:\Projects\Cursor\agentic-traffic-booster

# Start all services
docker-compose up -d

# Check logs for tweet-scout-service
docker-compose logs -f tweet-scout-service
```

---

## Quick Test Script (PowerShell)

Save this as `start-test-env.ps1`:

```powershell
# Start required services for tweet-scout testing

Write-Host "🚀 Starting Tweet Scout Test Environment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Navigate to project root
Set-Location "C:\Projects\Cursor\agentic-traffic-booster"

# Start services
Write-Host "`n📦 Starting Kafka, PostgreSQL, and Campaign Service..." -ForegroundColor Yellow
docker-compose up -d zookeeper kafka postgres campaign-service

# Wait for services to be healthy
Write-Host "`n⏳ Waiting for services to be ready (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check status
Write-Host "`n✅ Checking service status..." -ForegroundColor Yellow
docker-compose ps

# Verify Kafka
Write-Host "`n🔍 Verifying Kafka..." -ForegroundColor Yellow
docker exec atb-kafka kafka-topics --list --bootstrap-server localhost:9092

# Verify PostgreSQL
Write-Host "`n🔍 Verifying PostgreSQL..." -ForegroundColor Yellow
docker exec atb-postgres pg_isready -U postgres

# Verify Campaign Service
Write-Host "`n🔍 Verifying Campaign Service..." -ForegroundColor Yellow
Start-Sleep -Seconds 10  # Give campaign service time to start
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8082/api/campaigns" -Method Get
    Write-Host "✅ Campaign Service is responding" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Campaign Service not ready yet, may need more time" -ForegroundColor Red
}

Write-Host "`n🎉 Dependencies are ready!" -ForegroundColor Green
Write-Host "`nNow you can run tweet-scout-service:" -ForegroundColor Cyan
Write-Host "  cd backend\tweet-scout-service" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
```

Run it:
```powershell
.\start-test-env.ps1
```

---

## Verification Checklist

Before running tweet-scout-service, verify:

### ✅ Kafka is Running
```bash
# Test Kafka connectivity
docker exec atb-kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# Create test topic (optional)
docker exec atb-kafka kafka-topics --create --topic test --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

### ✅ PostgreSQL is Running
```bash
# Test PostgreSQL
docker exec atb-postgres psql -U postgres -d atb_social -c "\dt"

# Should show tables (campaigns, products, etc.)
```

### ✅ Campaign Service is Running
```bash
# Test Campaign Service API
curl http://localhost:8082/actuator/health
# Should return: {"status":"UP"}

curl http://localhost:8082/api/campaigns
# Should return: [] or list of campaigns
```

### ✅ Create a Test Campaign
```bash
curl -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "status": "ACTIVE",
    "mode": "SEMI_AUTO",
    "hashtags": ["#test", "#demo"],
    "keywords": ["test product"]
  }'
```

---

## Monitoring Services

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f kafka
docker-compose logs -f postgres
docker-compose logs -f campaign-service

# Last 100 lines
docker-compose logs --tail=100 campaign-service
```

### Check Resource Usage

```bash
# Docker stats
docker stats

# Specific containers
docker stats atb-kafka atb-postgres atb-campaign-service
```

---

## Troubleshooting

### Issue: Port Already in Use

```bash
# Check what's using the port
netstat -ano | findstr :9092    # Kafka
netstat -ano | findstr :5432    # PostgreSQL
netstat -ano | findstr :8082    # Campaign Service

# Kill the process (if needed)
taskkill /PID <process_id> /F
```

### Issue: Services Won't Start

```bash
# Remove old containers
docker-compose down -v

# Rebuild and start fresh
docker-compose up -d --build zookeeper kafka postgres campaign-service
```

### Issue: Campaign Service Won't Connect to DB

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Check if database exists
docker exec atb-postgres psql -U postgres -c "\l"

# Create database if missing
docker exec atb-postgres psql -U postgres -c "CREATE DATABASE atb_social;"
```

### Issue: Kafka Not Ready

```bash
# Check Zookeeper first
docker-compose logs zookeeper

# Check Kafka logs
docker-compose logs kafka

# Restart Kafka
docker-compose restart kafka

# Wait for "Kafka Server started" message
docker-compose logs -f kafka
```

---

## Clean Up / Reset

### Stop Services
```bash
# Stop all
docker-compose down

# Stop specific services
docker-compose stop zookeeper kafka postgres campaign-service
```

### Remove Data and Start Fresh
```bash
# ⚠️ WARNING: This deletes all data!
docker-compose down -v

# Start fresh
docker-compose up -d zookeeper kafka postgres campaign-service
```

### Remove Only Tweet Scout Data
```bash
# Delete Kafka topic
docker exec atb-kafka kafka-topics --delete --topic new_tweets --bootstrap-server localhost:9092
```

---

## Summary - Quick Commands

**Start dependencies:**
```bash
docker-compose up -d zookeeper kafka postgres campaign-service
```

**Verify they're running:**
```bash
docker-compose ps
curl http://localhost:8082/api/campaigns
```

**Run tweet-scout-service:**
```bash
cd backend/tweet-scout-service
npm run dev
```

**Monitor Kafka messages:**
```bash
docker exec atb-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic new_tweets --from-beginning
```

**Stop everything:**
```bash
docker-compose down
```

---

## What's Running Where

| Service | Port | Container Name | Purpose |
|---------|------|----------------|---------|
| Zookeeper | 2181 | atb-zookeeper | Kafka coordination |
| Kafka | 9092 | atb-kafka | Message broker |
| PostgreSQL | 5432 | atb-postgres | Database |
| Campaign Service | 8082 | atb-campaign-service | Campaign management |
| Tweet Scout Service | - | (runs locally) | Tweet scraping |

---

## Ready to Test! 🎉

Once all services show as healthy:

1. ✅ Kafka running on `localhost:9092`
2. ✅ PostgreSQL running on `localhost:5432`
3. ✅ Campaign Service running on `http://localhost:8082`

You can now run tweet-scout-service:
```bash
cd backend/tweet-scout-service
npm run dev
```

Check `TESTING.md` for comprehensive test scenarios!

