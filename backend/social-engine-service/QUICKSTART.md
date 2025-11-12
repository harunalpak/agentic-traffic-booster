# Social Engine Service - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites

✅ Java 21
✅ PostgreSQL 14+
✅ Kafka 3.x
✅ OpenAI API Key

### Step 1: Set Environment Variables (1 min)

```bash
# Copy template
cp env.template .env

# Edit .env and set:
# - OPENAI_API_KEY (required)
# - SPRING_DATASOURCE_PASSWORD (if changed)

# Load variables
export $(cat .env | xargs)
```

### Step 2: Start Infrastructure (2 min)

```bash
# Option A: Using Docker Compose (Recommended)
docker-compose up -d postgres kafka

# Option B: Local Installation
# Start PostgreSQL
sudo systemctl start postgresql

# Start Kafka (in separate terminal)
cd kafka_2.13-3.6.0
bin/zookeeper-server-start.sh config/zookeeper.properties &
bin/kafka-server-start.sh config/server.properties &
```

### Step 3: Create Database (30 sec)

```bash
# Create database
createdb atb_social

# Or using psql
psql -U postgres -c "CREATE DATABASE atb_social;"
```

### Step 4: Build & Run (1.5 min)

```bash
# Build
mvn clean package -DskipTests

# Run
java -jar target/social-engine-service-1.0.0.jar
```

### Step 5: Verify (30 sec)

```bash
# Check health
curl http://localhost:8083/api/health

# Expected:
# {"status":"UP","service":"social-engine-service",...}
```

## 🎉 You're Running!

The service will automatically:
- ✅ Create database tables
- ✅ Create Kafka topics
- ✅ Start tweet scouting (every 30 min)
- ✅ Generate AI replies
- ✅ Save tasks to database

## 📊 Check Results

```bash
# View tasks
curl http://localhost:8083/api/tasks/pending

# Check database
psql -U postgres atb_social
SELECT * FROM tasks;
```

## 🛑 Common Issues

### "Database connection failed"
```bash
# Fix: Ensure PostgreSQL is running
sudo systemctl start postgresql
```

### "Kafka connection failed"
```bash
# Fix: Start Kafka
cd kafka_2.13-3.6.0
bin/kafka-server-start.sh config/server.properties
```

### "OpenAI API error"
```bash
# Fix: Set valid API key
export OPENAI_API_KEY=sk-your-actual-key
```

## 📚 Next Steps

- Read [README.md](README.md) for full documentation
- Check [SETUP.md](SETUP.md) for detailed setup
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- See [logs/] for application logs

## 🐳 Docker Quick Start (Alternative)

```bash
# Set your OpenAI key
export OPENAI_API_KEY=sk-your-key

# Start everything
docker-compose up -d

# View logs
docker-compose logs -f social-engine-service

# Stop everything
docker-compose down
```

That's it! 🎊

