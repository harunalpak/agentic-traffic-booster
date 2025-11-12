# Social Engine Service

**Autonomous Tweet Discovery & Reply Generation for Agentic Traffic Booster**

## 🎯 Purpose

The Social Engine Service autonomously discovers relevant tweets, generates intelligent product-based replies using ChatGPT, and creates reply tasks for manual review or automatic campaigns.

## 🧱 Architecture

### Core Modules

1. **TweetScout** - Scheduled tweet discovery
   - Periodically fetches tweets related to active campaigns
   - Uses Twitter Scraper or Twitter API
   - Publishes discovered tweets to Kafka

2. **ReplyGenerator** - AI-powered reply creation
   - Consumes tweets from Kafka
   - Fetches campaign and product information
   - Generates unique short links
   - Uses ChatGPT to create natural, conversational replies
   - Publishes replies to Kafka

3. **TaskManager** - Reply task persistence
   - Consumes generated replies
   - Saves to PostgreSQL for manual review
   - Supports AUTO and SEMI_AUTO modes

4. **ShortLinkService** - Dynamic link generation
   - Integrates with Bitly API
   - Fallback to query parameter method
   - Maintains link usage logs

### Tech Stack

- **Java 21** + **Spring Boot 3**
- **Kafka** - Async event streaming
- **PostgreSQL** - Task and link storage
- **OpenAI API** - Intelligent reply generation
- **Bitly API** - Short link creation
- **WebClient** - Inter-service communication

## 📊 Data Flow

```
┌─────────────────────────┐
│  tweet-scout-service    │ (Node.js)
│    (Scheduler)          │
└────────┬────────────────┘
         │ publishes to
         ▼
    new_tweets (Kafka Topic)
         │
         │ consumed by
         ▼
┌─────────────────────────┐
│ ReplyGenerator          │ (Consumer)
│  ├─ Campaign Client     │
│  ├─ Product Client      │
│  ├─ ShortLink Service   │
│  └─ ChatGPT Service     │
└────────┬────────────────┘
         │ publishes to ✅ (Kafka-based)
         ▼
generated_replies (Kafka Topic)
         │
         │ consumed by
         ▼
┌─────────────────────────┐
│  TaskConsumer           │
└────────┬────────────────┘
         │ saves to
         ▼
    PostgreSQL (tasks table)

📌 Fully Event-Driven Architecture
   - No direct database writes in ReplyGenerator
   - Complete decoupling via Kafka
   - Independent scalability
```

## 🚀 Quick Start

### Prerequisites

- Java 21
- Maven 3.9+
- PostgreSQL 14+
- Kafka 3.x
- OpenAI API Key

### Environment Variables

Create `.env` file or export these variables:

```bash
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/atb_social
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=secret

# Kafka
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# External Services
CAMPAIGN_SERVICE_URL=http://localhost:8082
PRODUCT_SERVICE_URL=http://localhost:8080

# OpenAI
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini

# Bitly (Optional)
BITLY_TOKEN=your-bitly-token

# Server
SERVER_PORT=8083
```

### Database Setup

```sql
-- Create database
CREATE DATABASE atb_social;

-- Tables are auto-created by Hibernate (ddl-auto: update)
```

### Build & Run

```bash
# Build
mvn clean package -DskipTests

# Run
java -jar target/social-engine-service-1.0.0.jar

# Or with Maven
mvn spring-boot:run
```

### Using Docker

```bash
# Build image
docker build -t social-engine-service:latest .

# Run container
docker run -p 8083:8083 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/atb_social \
  -e OPENAI_API_KEY=sk-your-key \
  social-engine-service:latest
```

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```

### Task Management

#### Get Pending Tasks
```http
GET /api/tasks/pending
```

#### Get Tasks by Campaign
```http
GET /api/tasks/campaign/{campaignId}
```

#### Approve Task
```http
POST /api/tasks/{taskId}/approve
```

#### Reject Task
```http
POST /api/tasks/{taskId}/reject
```

#### Update Task Status
```http
PUT /api/tasks/{taskId}/status?status=APPROVED
```

## 🔧 Configuration

### Tweet Scout Schedule

Default: Every 30 minutes

```yaml
tweet:
  scout:
    interval: 1800000  # milliseconds
```

### ChatGPT Settings

```yaml
openai:
  model: gpt-4o-mini
  temperature: 0.8
  max:
    tokens: 150
```

### Kafka Topics

- `new_tweets` - Discovered tweets
- `generated_replies` - AI-generated replies
- `dead_letter` - Failed messages

## 🧪 Testing

### Mock Tweet Generation

For development, the service generates mock tweets when Twitter Scraper is not configured.

To use real Twitter data:

1. Install twitter-scraper: `npm install -g @the-convocation/twitter-scraper`
2. Uncomment the `searchTwitterViaNodeScript` method in `TweetScoutScheduler`

## 📊 Database Schema

### tasks
```sql
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    tweet_id VARCHAR(255) NOT NULL,
    campaign_id BIGINT NOT NULL,
    reply_text TEXT NOT NULL,
    mode VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    tweet_author VARCHAR(255),
    tweet_text TEXT,
    tweet_url VARCHAR(512),
    confidence_score DOUBLE PRECISION,
    short_link VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

### short_link_log
```sql
CREATE TABLE short_link_log (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT,
    campaign_id BIGINT,
    original_url VARCHAR(1024) NOT NULL,
    short_url VARCHAR(255) NOT NULL UNIQUE,
    link_provider VARCHAR(50),
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## 📝 Example Flow Logs

```
[INFO] ========================================
[INFO] TweetScout: Starting scheduled tweet discovery
[INFO] ========================================
[INFO] Found 3 active campaigns
[INFO] Processing campaign: Handmade Xmas (ID: 1)
[INFO] Search query: handmade OR Christmas OR gifts
[INFO] Mock search returned 5 tweets
[INFO] Found 5 tweets for campaign 'Handmade Xmas'
[INFO] ========================================
[INFO] TweetScout: Published 5 total tweets to Kafka
[INFO] ========================================

[INFO] ========================================
[INFO] ReplyGenerator: Processing tweet mock_1699876543210_0
[INFO] Tweet author: @user_0
[INFO] Tweet text: Looking for handmade OR Christmas OR gifts products! Any recommendations?
[INFO] ========================================
[INFO] Campaign: Handmade Xmas (mode: SEMI_AUTO)
[INFO] Product: Funny Christmas Shirt – Santa's Favorite Teacher Tee
[INFO] Generated short link: https://amzn.to/Xyz123?ref=AbCdEfGh
[INFO] ChatGPT reply: Love handmade gifts! Check out this Funny Christmas Shirt – Santa's Favorite Teacher Tee. Perfect for the holidays! 🎄 https://amzn.to/Xyz123?ref=AbCdEfGh #handmade #Christmas
[INFO] ========================================
[INFO] ReplyGenerator: Successfully published reply for tweet mock_1699876543210_0
[INFO] ========================================

[INFO] ========================================
[INFO] TaskConsumer: Processing reply for tweet mock_1699876543210_0
[INFO] Reply text: Love handmade gifts! Check out this Funny Christmas Shirt...
[INFO] ========================================
[INFO] Created task 42 for tweet mock_1699876543210_0 (campaign 1)
[INFO] ========================================
[INFO] TaskConsumer: Saved reply as task 42 in database
[INFO] Status: PENDING (awaiting review or automation)
[INFO] ========================================
```

## 🔍 Monitoring

### Kafka Consumer Groups

```bash
# List consumer groups
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list

# Check lag
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group social-engine-group --describe
```

### Database Queries

```sql
-- Pending tasks count
SELECT COUNT(*) FROM tasks WHERE status = 'PENDING';

-- Tasks by campaign
SELECT campaign_id, COUNT(*) as task_count 
FROM tasks 
GROUP BY campaign_id;

-- Short link usage
SELECT short_url, click_count 
FROM short_link_log 
ORDER BY click_count DESC 
LIMIT 10;
```

## 🚨 Error Handling

- Failed messages are sent to `dead_letter` topic
- All exceptions are logged with full context
- Database transactions ensure data consistency
- Kafka consumer acknowledgment prevents message loss

## 🔐 Security Notes

- Store API keys in environment variables
- Use HTTPS for production endpoints
- Implement rate limiting for OpenAI calls
- Monitor Kafka consumer lag

## 🛠️ Future Enhancements

1. **Auto-posting** - Automatically post approved replies
2. **Sentiment Analysis** - Filter tweets by sentiment
3. **Multi-language Support** - Generate replies in multiple languages
4. **A/B Testing** - Test different reply strategies
5. **Analytics Dashboard** - Track reply performance

## 📚 Related Services

- **campaign-service** (Port 8082) - Campaign management
- **product-service** (Port 8080) - Product catalog
- **traffic-engine** (Future) - Automated posting

## 📄 License

Part of the Agentic Traffic Booster project.

## 👥 Contact

For questions or issues, please refer to the main ATB project documentation.

