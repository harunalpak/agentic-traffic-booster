# Agentic Traffic Booster - System Architecture

## 🎯 Project Overview

**Agentic Traffic Booster** is an AI-powered marketing automation platform that autonomously discovers relevant tweets, generates intelligent replies, and manages social media engagement campaigns for Amazon Handmade products.

### Key Features

- 🔍 **Automated Tweet Discovery** - Real-time Twitter scraping with campaign-based filtering
- 🤖 **AI-Powered Reply Generation** - ChatGPT-based contextual responses
- 🎯 **Campaign Management** - Multi-channel marketing campaign orchestration
- 📊 **Task Management** - Review and approve AI-generated replies
- 🔗 **URL Shortening** - Bitly integration for tracking
- ⚠️ **Risk Analysis** - Automatic detection of risky/controversial content
- 📈 **Analytics & Monitoring** - Comprehensive logging and statistics

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Frontend (Next.js)                          │
│  Product Management | Campaign Creation | Task Review & Approval    │
└───────────────┬─────────────────────────────────────────────────────┘
                │
                │ HTTP REST API
                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        Backend Microservices                          │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Product    │  │   Campaign   │  │   Social Engine Service  │  │
│  │   Service    │  │   Service    │  │   (Reply Generator)      │  │
│  │   (Java)     │  │   (Java)     │  │   (Java + OpenAI)        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────────┘  │
│         │                  │                  │                       │
│         │                  │                  │                       │
│         └─────────┬────────┴────────┬─────────┘                      │
│                   │                 │                                │
│                   ▼                 ▼                                │
│          ┌─────────────────┐  ┌──────────────┐                      │
│          │   PostgreSQL    │  │    Kafka     │                      │
│          │   Database      │  │  (Message    │                      │
│          └─────────────────┘  │   Broker)    │                      │
│                               └──────┬───────┘                       │
│                                      │                                │
│                                      │ new_tweets topic               │
│                                      │                                │
│  ┌──────────────────────────────────┴────────────────────────────┐  │
│  │              Tweet Scout Service (Node.js)                     │  │
│  │   Twitter Scraping | Campaign Monitoring | Tweet Publishing    │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                      │                                │
└──────────────────────────────────────┼────────────────────────────────┘
                                       │
                                       │ Real-time Twitter Scraping
                                       ▼
                               ┌────────────────┐
                               │   Twitter API  │
                               │   (via cycletls)│
                               └────────────────┘
```

---

## 🧩 Microservices Breakdown

### 1. Frontend (Next.js + React)

**Port**: 3000  
**Technology**: Next.js 14, TypeScript, TailwindCSS, shadcn/ui

**Features**:
- Product management (CRUD operations)
- Campaign creation wizard (multi-step form)
- Task management dashboard (review AI-generated replies)
- Real-time status updates
- Image upload to S3

**Key Pages**:
- `/products` - Product catalog
- `/campaigns` - Campaign management
- `/tasks` - AI reply review and approval

**API Communication**:
```typescript
Product Service:  http://localhost:8080/api/products
Campaign Service: http://localhost:8082/api/campaigns
Social Engine:    http://localhost:8083/api/tasks
```

---

### 2. Product Service (Spring Boot)

**Port**: 8080  
**Technology**: Java 21, Spring Boot 3.2, PostgreSQL

**Responsibilities**:
- Product CRUD operations
- S3 image storage
- Product catalog management

**Key Entities**:
```java
Product {
  id: Long
  title: String
  description: String
  price: BigDecimal
  productUrl: String
  imageUrl: String
  category: String
  tags: List<String>
  createdAt: LocalDateTime
}
```

**Endpoints**:
```
GET    /api/products
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}
POST   /api/products/upload-image
```

---

### 3. Campaign Service (Spring Boot)

**Port**: 8082  
**Technology**: Java 21, Spring Boot 3.2, PostgreSQL

**Responsibilities**:
- Campaign lifecycle management
- Multi-channel configuration
- Status tracking (DRAFT, ACTIVE, PAUSED, COMPLETED)

**Key Entities**:
```java
Campaign {
  id: Long
  name: String
  productId: Long
  channel: String  // TWITTER, INSTAGRAM, etc.
  mode: String     // AUTO, SEMI_AUTO
  status: String
  config: JSON     // Channel-specific config
  startDate: LocalDateTime
  endDate: LocalDateTime
}
```

**Twitter Configuration**:
```json
{
  "minFollowerCount": 150000,
  "hashtags": ["#Christmas", "#Handmade"],
  "recentWindowMinutes": 180
}
```

**Endpoints**:
```
GET    /api/campaigns
GET    /api/campaigns/{id}
POST   /api/campaigns
PUT    /api/campaigns/{id}
DELETE /api/campaigns/{id}
PUT    /api/campaigns/{id}/status
```

---

### 4. Tweet Scout Service (Node.js)

**Port**: 3001  
**Technology**: Node.js 20, KafkaJS, @the-convocation/twitter-scraper, CycleTLS

**Responsibilities**:
- Automated tweet discovery
- Real Twitter scraping (not mocks)
- Campaign-based filtering
- Kafka publishing

**Key Features**:
- **Real Twitter Scraping**: Uses `@the-convocation/twitter-scraper`
- **Anti-Bot Protection**: CycleTLS for bypassing Cloudflare
- **Time-Window Filtering**: Only recent tweets (configurable)
- **Follower Filtering**: Minimum follower count
- **Profile Enrichment**: Fetches tweet author profiles
- **Scheduled Execution**: Cron-based (configurable interval)

**Configuration** (`src/config/search.config.js`):
```javascript
{
  maxTweetsPerScan: 100,
  recentWindowMinutes: 180,
  minFollowers: 150000,
  searchMode: SEARCH_MODES.LATEST
}
```

**Twitter Authentication** (`.env`):
```bash
TWITTER_USERNAME=your_username
TWITTER_PASSWORD=your_password
TWITTER_EMAIL=your_email
```

**Flow**:
```
1. Fetch active campaigns from Campaign Service
2. For each campaign:
   - Parse config (hashtags, minFollowers, timeWindow)
   - Build search query
   - Scrape tweets using Twitter Scraper
   - Filter by time window and follower count
   - Enrich with profile data
   - Publish to Kafka topic "new_tweets"
```

**Kafka Message Format**:
```json
{
  "tweetId": "1878383920",
  "campaignId": 12,
  "author": "JaneDoe",
  "followerCount": 250000,
  "text": "Looking for handmade gifts...",
  "url": "https://twitter.com/i/web/status/1878383920",
  "likes": 5,
  "retweets": 2,
  "createdAt": "2025-11-14T12:00:00Z"
}
```

**Why Node.js?**
- Native Twitter Scraper library support
- Better for I/O-heavy operations
- CycleTLS integration
- Independent scaling

---

### 5. Social Engine Service (Spring Boot)

**Port**: 8083  
**Technology**: Java 21, Spring Boot 3.2, PostgreSQL, Kafka, OpenAI API

**Responsibilities**:
- Consume tweets from Kafka
- Generate AI-powered replies using ChatGPT
- Perform safety analysis (detect risky content)
- Generate contextual hashtags
- URL shortening (Bitly)
- Task creation for manual review

**Key Entities**:
```java
Task {
  id: Long
  tweetId: String
  campaignId: Long
  replyText: String
  mode: String         // AUTO, SEMI_AUTO
  status: String       // PENDING, POSTED, REJECTED
  tweetAuthor: String
  tweetText: String
  tweetUrl: String
  shortLink: String
  isRisky: Boolean
  riskReason: String
  createdAt: LocalDateTime
  updatedAt: LocalDateTime
}

ShortLinkLog {
  id: Long
  originalUrl: String
  shortUrl: String
  campaignId: Long
  productId: Long
  clickCount: Integer
  createdAt: LocalDateTime
}
```

**OpenAI Integration**:

**System Prompt**:
```
You are a creative, fun social media assistant who replies to tweets naturally.
Your job is to:
1) Reply to tweets in an entertaining, engaging, and authentic way
2) Subtly recommend relevant Amazon Handmade products when it fits naturally
3) Generate creative hashtags that match the tweet's topic and tone
4) Keep replies conversational and human-like - NO corporate speak
5) Add value to the conversation while gently promoting the product
Your replies should feel like they're from a cool friend, not a salesperson.
```

**Safety Analysis**:
- Detects political content
- Flags offensive language
- Identifies sensitive topics
- Marks polarizing issues
- Returns `isRisky` boolean and `riskReason` explanation

**Reply Format**:
```json
{
  "replyText": "Your fun reply with link and hashtags!",
  "isRisky": false,
  "riskReason": null
}
```

**Endpoints**:
```
GET  /api/tasks
GET  /api/tasks/{id}
GET  /api/tasks/stats
GET  /api/tasks/campaign/{campaignId}
PUT  /api/tasks/{id}/mark-posted
PUT  /api/tasks/{id}/reject
```

**Kafka Consumers**:
- `new_tweets` topic → Generate replies
- `generated_replies` topic → Process approved replies

---

## 🔄 Complete Data Flow

### 1. Tweet Discovery Flow

```
[Cron Scheduler] (every 30 min)
       │
       ▼
[Tweet Scout Service]
       │
       ├─► Fetch active campaigns (Campaign Service)
       │
       ├─► For each campaign:
       │   ├─► Parse config (hashtags, filters)
       │   ├─► Build search query
       │   ├─► Scrape Twitter (real-time)
       │   ├─► Filter tweets (time, followers)
       │   └─► Enrich with profiles
       │
       └─► Publish to Kafka → "new_tweets"
```

### 2. Reply Generation Flow

```
[Kafka: new_tweets]
       │
       ▼
[Social Engine Service] Kafka Consumer
       │
       ├─► Fetch product details
       ├─► Generate short link (Bitly)
       ├─► Call ChatGPT API
       │   ├─► Generate reply text
       │   ├─► Generate hashtags
       │   └─► Analyze safety/risk
       │
       └─► Save Task (PostgreSQL)
           ├─► status: PENDING
           ├─► isRisky: true/false
           └─► riskReason: "..."
```

### 3. Manual Review Flow

```
[Frontend: Tasks Page]
       │
       ├─► Fetch tasks (GET /api/tasks)
       │   └─► Filter: PENDING, Campaign, Mode
       │
       ├─► Display:
       │   ├─► Original tweet
       │   ├─► AI-generated reply
       │   ├─► Risk warning (if any)
       │   └─► Product link
       │
       └─► User Actions:
           ├─► Copy reply
           ├─► Open Twitter
           ├─► Mark as POSTED ✅
           └─► Discard (REJECTED) ❌
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: React Query
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios

### Backend Services

**Java Services** (Product, Campaign, Social Engine):
- **Language**: Java 21
- **Framework**: Spring Boot 3.2
- **Database**: PostgreSQL 16
- **ORM**: Spring Data JPA
- **Messaging**: Kafka (Spring Kafka)
- **Build Tool**: Maven

**Node.js Service** (Tweet Scout):
- **Language**: Node.js 20
- **Runtime**: ES Modules
- **Scraping**: @the-convocation/twitter-scraper
- **Anti-Bot**: CycleTLS
- **Messaging**: KafkaJS
- **Scheduling**: node-cron
- **Logging**: Pino

### Infrastructure
- **Database**: PostgreSQL 16
- **Message Broker**: Apache Kafka 3.6 + Zookeeper
- **Containerization**: Docker + Docker Compose
- **File Storage**: AWS S3
- **URL Shortening**: Bitly API
- **AI**: OpenAI GPT-4o-mini

---

## 🚀 Setup & Deployment

### Prerequisites

```bash
- Docker & Docker Compose
- Node.js 20+ (for local tweet-scout dev)
- Java 21+ (for local Java service dev)
- AWS Account (S3)
- OpenAI API Key
- Bitly API Token
- Twitter Account (for scraping)
```

### Environment Variables

**Root `.env`**:
```bash
# Twitter Credentials
TWITTER_USERNAME=your_username
TWITTER_PASSWORD=your_password
TWITTER_EMAIL=your_email

# OpenAI
OPENAI_API_KEY=sk-your-key-here

# Bitly (optional)
BITLY_TOKEN=your_bitly_token

# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
```

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/yourusername/agentic-traffic-booster.git
cd agentic-traffic-booster

# 2. Create .env file (see above)
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Run tweet-scout locally (CycleTLS doesn't work in Docker)
cd backend/tweet-scout-service
npm install
node src/index.js

# 5. Access services
Frontend:        http://localhost:3000
Product Service: http://localhost:8080
Campaign Service: http://localhost:8082
Social Engine:   http://localhost:8083
```

### Service Ports

```
Frontend:         3000
Tweet Scout:      3001 (if needed)
Product Service:  8080
Campaign Service: 8082
Social Engine:    8083
PostgreSQL:       5432
Kafka:            9092
Zookeeper:        2181
```

---

## 📊 Database Schema

### Products Table
```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  product_url VARCHAR(500),
  image_url VARCHAR(500),
  category VARCHAR(100),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Campaigns Table
```sql
CREATE TABLE campaigns (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  product_id BIGINT REFERENCES products(id),
  channel VARCHAR(50),
  mode VARCHAR(20),
  status VARCHAR(20),
  config JSONB,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  tweet_id VARCHAR(255) UNIQUE NOT NULL,
  campaign_id BIGINT NOT NULL,
  reply_text TEXT NOT NULL,
  mode VARCHAR(20),
  status VARCHAR(20),
  tweet_author VARCHAR(255),
  tweet_text TEXT,
  tweet_url VARCHAR(500),
  short_link VARCHAR(500),
  confidence_score DECIMAL(3,2),
  is_risky BOOLEAN,
  risk_reason TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP
);
```

### Short Link Log Table
```sql
CREATE TABLE short_link_log (
  id BIGSERIAL PRIMARY KEY,
  original_url VARCHAR(1000),
  short_url VARCHAR(500),
  campaign_id BIGINT,
  product_id BIGINT,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL
);
```

---

## 🔐 Security Considerations

### Current State (Development)

- HTTP communication (no HTTPS)
- No authentication between microservices
- Plaintext Kafka messages
- API keys in `.env` files

### Production Recommendations

1. **API Gateway** with authentication (JWT)
2. **HTTPS** for all HTTP communication
3. **Kafka SSL/SASL** encryption
4. **Secret Management** (AWS Secrets Manager, HashiCorp Vault)
5. **Rate Limiting** on all endpoints
6. **CORS** configuration
7. **Input Validation** and sanitization
8. **SQL Injection** prevention (parameterized queries)

---

## 📈 Monitoring & Observability

### Logging

**Current**:
- Console logs with timestamps
- Pino (Node.js) with pretty formatting
- Spring Boot default logging

**Recommended**:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Structured JSON logs
- Log aggregation

### Metrics (Future)

```javascript
// Prometheus metrics
tweets_discovered_total
tweets_published_total
replies_generated_total
tasks_created_total
tasks_posted_total
tasks_rejected_total
openai_api_calls_total
bitly_api_calls_total
scraping_duration_seconds
reply_generation_duration_seconds
```

### Health Checks

```bash
GET /health
{
  "status": "UP",
  "services": {
    "database": "UP",
    "kafka": "UP",
    "openai": "UP"
  }
}
```

---

## 🧪 Testing

### Unit Tests

```bash
# Frontend
cd frontend
npm test

# Tweet Scout Service
cd backend/tweet-scout-service
npm test

# Java Services
cd backend/product-service
mvn test
```

### Integration Tests

```bash
# Test complete flow
1. Create product
2. Create campaign
3. Run tweet scout
4. Verify Kafka messages
5. Verify task creation
6. Mark task as posted
```

---

## 🚀 Future Enhancements

### Phase 2: Advanced Features

1. **Auto-Posting** - Automatically post approved replies
2. **Multi-Channel** - Instagram, Facebook, LinkedIn support
3. **Sentiment Analysis** - Filter tweets by sentiment
4. **Lead Scoring** - Rank tweets by conversion potential
5. **A/B Testing** - Test different reply strategies

### Phase 3: Intelligence

1. **ML-based Relevance** - Score tweet relevance using ML
2. **Trend Detection** - Identify trending topics
3. **Optimal Timing** - Post at best engagement times
4. **Influencer Detection** - Prioritize high-influence accounts

### Phase 4: Scale

1. **Redis Caching** - Cache scraped tweets, profiles
2. **Rate Limit Management** - Dynamic backoff strategies
3. **Parallel Processing** - Multi-threaded scraping
4. **Auto-scaling** - Scale based on campaign volume
5. **Leader Election** - Single scout executor

---

## 📦 Project Structure

```
agentic-traffic-booster/
├── frontend/                    # Next.js frontend
│   ├── src/
│   │   ├── app/                # App router pages
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilities
│   │   └── stores/             # State management
│   └── Dockerfile
│
├── backend/
│   ├── product-service/        # Product management
│   │   ├── src/main/java/
│   │   └── pom.xml
│   │
│   ├── campaign-service/       # Campaign management
│   │   ├── src/main/java/
│   │   └── pom.xml
│   │
│   ├── social-engine-service/  # Reply generation
│   │   ├── src/main/java/
│   │   └── pom.xml
│   │
│   └── tweet-scout-service/    # Tweet discovery
│       ├── src/
│       │   ├── config/
│       │   ├── services/
│       │   ├── scheduler/
│       │   └── index.js
│       └── package.json
│
├── docker-compose.yml          # Orchestration
├── .env                        # Environment variables
└── ARCHITECTURE.md             # This file
```

---

## 🎓 Key Design Principles

1. **Microservices Architecture** - Independent, scalable services
2. **Event-Driven** - Kafka for async communication
3. **Polyglot** - Right tool for the job (Node.js for scraping, Java for business logic)
4. **Stateless Services** - No local state, scale horizontally
5. **AI-First** - ChatGPT for intelligent automation
6. **Safety First** - Risk analysis before posting
7. **Human-in-the-Loop** - Manual review for semi-auto mode

---

**Version**: 1.0  
**Last Updated**: November 2024  
**Status**: Production-Ready

**Built with** ❤️ using Node.js, Spring Boot, Next.js, Kafka, OpenAI, and CycleTLS

