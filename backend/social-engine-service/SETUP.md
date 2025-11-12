# Social Engine Service - Setup Guide

## 🚀 Complete Setup Instructions

### Step 1: Prerequisites Installation

#### 1.1 Install Java 21
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-21-jdk

# macOS
brew install openjdk@21

# Verify
java -version
```

#### 1.2 Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql@14

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS
```

#### 1.3 Install Kafka
```bash
# Download Kafka
wget https://downloads.apache.org/kafka/3.6.0/kafka_2.13-3.6.0.tgz
tar -xzf kafka_2.13-3.6.0.tgz
cd kafka_2.13-3.6.0

# Start Zookeeper (Terminal 1)
bin/zookeeper-server-start.sh config/zookeeper.properties

# Start Kafka (Terminal 2)
bin/kafka-server-start.sh config/server.properties
```

### Step 2: Database Configuration

#### 2.1 Create Database
```bash
# Access PostgreSQL
sudo -u postgres psql

# In psql console
CREATE DATABASE atb_social;
CREATE USER atb_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE atb_social TO atb_user;
\q
```

#### 2.2 Verify Database
```bash
psql -U atb_user -d atb_social -h localhost
# Password: secure_password

# Should see: atb_social=#
\dt  # List tables (empty initially)
\q
```

### Step 3: External Services Setup

#### 3.1 Get OpenAI API Key

1. Visit https://platform.openai.com/
2. Sign up or log in
3. Go to API Keys section
4. Create new secret key
5. Copy the key (starts with `sk-`)

**Cost Estimate:** $0.002 per 1K tokens (gpt-4o-mini)

#### 3.2 Get Bitly Token (Optional)

1. Visit https://bitly.com/
2. Sign up for free account
3. Go to Settings → Developer Settings
4. Generate Access Token
5. Copy the token

**Alternative:** Service uses fallback method if no Bitly token

#### 3.3 Verify Campaign & Product Services

```bash
# Check campaign-service
curl http://localhost:8082/api/campaigns

# Check product-service
curl http://localhost:8080/api/products

# If not running, start them first
cd backend/campaign-service && mvn spring-boot:run
cd backend/product-service && mvn spring-boot:run
```

### Step 4: Configure Environment

#### 4.1 Create Environment File

Create `backend/social-engine-service/.env`:

```env
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/atb_social
SPRING_DATASOURCE_USERNAME=atb_user
SPRING_DATASOURCE_PASSWORD=secure_password

# Kafka
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# External Services
CAMPAIGN_SERVICE_URL=http://localhost:8082
PRODUCT_SERVICE_URL=http://localhost:8080

# OpenAI (REQUIRED)
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4o-mini

# Bitly (OPTIONAL - fallback used if not set)
BITLY_TOKEN=

# Server
SERVER_PORT=8083

# Tweet Scout
TWEET_SCOUT_INTERVAL=300000
```

#### 4.2 Load Environment (if using .env file)

```bash
# Linux/macOS
export $(cat .env | xargs)

# Or manually export each variable
export OPENAI_API_KEY=sk-your-key
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/atb_social
# ... etc
```

### Step 5: Build & Run Service

#### 5.1 Build Project
```bash
cd backend/social-engine-service

# Download dependencies
mvn dependency:resolve

# Build (skip tests for faster build)
mvn clean package -DskipTests

# Build with tests
mvn clean package
```

#### 5.2 Run Service
```bash
# Method 1: Using JAR
java -jar target/social-engine-service-1.0.0.jar

# Method 2: Using Maven
mvn spring-boot:run

# Method 3: With custom profile
java -jar target/social-engine-service-1.0.0.jar --spring.profiles.active=dev

# Method 4: With inline env vars
OPENAI_API_KEY=sk-key java -jar target/social-engine-service-1.0.0.jar
```

#### 5.3 Verify Service Running

```bash
# Check health
curl http://localhost:8083/api/health

# Expected response:
# {
#   "status": "UP",
#   "service": "social-engine-service",
#   "timestamp": "2024-11-12T10:30:00",
#   "version": "1.0.0"
# }
```

### Step 6: Verify Kafka Topics

```bash
cd kafka_2.13-3.6.0

# List topics
bin/kafka-topics.sh --bootstrap-server localhost:9092 --list

# Should see:
# new_tweets
# generated_replies
# dead_letter

# Check topic details
bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic new_tweets
```

### Step 7: Test the Flow

#### 7.1 Check Logs

Watch the application logs for:

```
[INFO] ========================================
[INFO] TweetScout: Starting scheduled tweet discovery
[INFO] ========================================
[INFO] Found X active campaigns
```

#### 7.2 Verify Database

```bash
psql -U atb_user -d atb_social -h localhost

# Check tables were created
\dt

# Should see:
# - tasks
# - short_link_log

# Check tasks
SELECT * FROM tasks;

# Check short links
SELECT * FROM short_link_log;
```

#### 7.3 Monitor Kafka Messages

```bash
# Watch new_tweets topic
bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic new_tweets \
  --from-beginning

# Watch generated_replies topic
bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic generated_replies \
  --from-beginning
```

#### 7.4 Test API Endpoints

```bash
# Get pending tasks
curl http://localhost:8083/api/tasks/pending

# Get tasks by campaign
curl http://localhost:8083/api/tasks/campaign/1

# Approve a task
curl -X POST http://localhost:8083/api/tasks/1/approve

# Reject a task
curl -X POST http://localhost:8083/api/tasks/2/reject
```

### Step 8: Docker Deployment (Alternative)

#### 8.1 Using Docker Compose

Create `backend/social-engine-service/docker-compose.yml` (see below)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f social-engine-service

# Stop services
docker-compose down
```

#### 8.2 Standalone Docker

```bash
# Build image
docker build -t social-engine-service:latest .

# Run container
docker run -d \
  --name social-engine \
  -p 8083:8083 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/atb_social \
  -e SPRING_DATASOURCE_USERNAME=atb_user \
  -e SPRING_DATASOURCE_PASSWORD=secure_password \
  -e SPRING_KAFKA_BOOTSTRAP_SERVERS=host.docker.internal:9092 \
  -e OPENAI_API_KEY=sk-your-key \
  -e CAMPAIGN_SERVICE_URL=http://host.docker.internal:8082 \
  -e PRODUCT_SERVICE_URL=http://host.docker.internal:8080 \
  social-engine-service:latest

# View logs
docker logs -f social-engine
```

### Step 9: Production Checklist

- [ ] Set strong database password
- [ ] Store API keys in secrets manager (not .env files)
- [ ] Enable SSL/TLS for PostgreSQL
- [ ] Configure Kafka authentication
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation (ELK stack)
- [ ] Set up backup strategy for PostgreSQL
- [ ] Implement rate limiting for OpenAI API
- [ ] Configure auto-scaling
- [ ] Set up alerting for failures

### Step 10: Troubleshooting

#### Issue: Service won't start - Database connection failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U atb_user -d atb_social -h localhost

# Check firewall
sudo ufw status
```

#### Issue: Kafka connection failed

```bash
# Check Kafka is running
jps | grep Kafka

# Check topics exist
bin/kafka-topics.sh --bootstrap-server localhost:9092 --list

# Restart Kafka
bin/kafka-server-stop.sh
bin/kafka-server-start.sh config/server.properties
```

#### Issue: OpenAI API errors

```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check rate limits
# OpenAI free tier: 3 requests/minute
# Paid tier: Higher limits
```

#### Issue: Campaign/Product service not reachable

```bash
# Check services are running
curl http://localhost:8082/api/health
curl http://localhost:8080/api/health

# Check ports
netstat -tuln | grep 808

# Start services
cd backend/campaign-service && mvn spring-boot:run &
cd backend/product-service && mvn spring-boot:run &
```

### Step 11: Development Tips

#### Enable Debug Logging

```yaml
# application-dev.yml
logging:
  level:
    com.atb.socialengine: DEBUG
    org.springframework.kafka: DEBUG
```

#### Reduce Tweet Scout Interval

```yaml
# application-dev.yml
tweet:
  scout:
    interval: 60000  # 1 minute for testing
```

#### Use H2 Database for Testing

```yaml
# application-test.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
```

## 📞 Support

If you encounter issues:

1. Check logs: `tail -f logs/social-engine-service.log`
2. Verify all environment variables are set
3. Ensure external services are running
4. Check Kafka topics and consumer groups
5. Refer to main README.md for architecture details

---

**Next Steps:**
- Review the API documentation in README.md
- Set up monitoring and alerting
- Configure production environment
- Test with real Twitter data

