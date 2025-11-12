# Social Engine Service - Architecture Documentation

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Social Engine Service                         │
│                                                                   │
│  ┌───────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │  TweetScout   │───▶│    Kafka     │◀──▶│ ReplyGenerator  │  │
│  │  (Scheduler)  │    │   Topics     │    │   (Consumer)    │  │
│  └───────────────┘    └──────────────┘    └─────────────────┘  │
│         │                    │                       │           │
│         │                    ▼                       ▼           │
│         │            ┌──────────────┐        ┌─────────────┐    │
│         │            │ TaskConsumer │        │  Services   │    │
│         │            └──────────────┘        └─────────────┘    │
│         │                    │                       │           │
│         ▼                    ▼                       ▼           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     PostgreSQL                             │  │
│  │                 (tasks, short_link_log)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         │                                              │
         │ HTTP Requests                                │ HTTP Requests
         ▼                                              ▼
┌──────────────────┐                          ┌──────────────────┐
│ Campaign Service │                          │ Product Service  │
│   (Port 8082)    │                          │   (Port 8080)    │
└──────────────────┘                          └──────────────────┘

         │                                              │
         │ REST API                                     │ REST API
         ▼                                              ▼
┌────────────────────────────────────────────────────────────────┐
│                        OpenAI API                               │
│                     (ChatGPT - gpt-4o-mini)                     │
└────────────────────────────────────────────────────────────────┘

         │                                              
         │ REST API                                     
         ▼                                              
┌────────────────────────────────────────────────────────────────┐
│                        Bitly API                                │
│                   (Short Link Generation)                       │
└────────────────────────────────────────────────────────────────┘
```

## 📦 Module Breakdown

### 1. TweetScout Module

**Location:** `scheduler/TweetScoutScheduler.java`

**Purpose:** Discover relevant tweets based on campaign criteria

**Flow:**
1. Scheduled execution (every 30 minutes)
2. Fetch active campaigns from campaign-service
3. Build search queries from keywords/hashtags
4. Search Twitter (or generate mock tweets)
5. Publish discovered tweets to Kafka `new_tweets` topic

**Key Methods:**
- `scoutTweets()` - Main scheduler method
- `scoutTweetsForCampaign()` - Per-campaign tweet discovery
- `buildSearchQuery()` - Query construction
- `searchTwitter()` - Tweet search (mock implementation)

**Dependencies:**
- CampaignClientService
- KafkaTemplate

**Configuration:**
```yaml
tweet:
  scout:
    interval: 1800000  # 30 minutes
```

### 2. ReplyGenerator Module

**Location:** `consumer/ReplyGeneratorConsumer.java`

**Purpose:** Generate intelligent, conversational replies using AI

**Flow:**
1. Consume tweets from Kafka `new_tweets` topic
2. Fetch campaign details (campaign-service)
3. Fetch product information (product-service)
4. Generate short link (ShortLinkService)
5. Create ChatGPT prompt with context
6. Call OpenAI API for reply generation
7. Publish reply to Kafka `generated_replies` topic

**Key Methods:**
- `processNewTweet()` - Main consumer method

**Dependencies:**
- CampaignClientService
- ProductClientService
- ShortLinkService
- ChatGPTService
- KafkaTemplate

**Error Handling:**
- Failed messages sent to `dead_letter` topic
- Comprehensive logging
- Message acknowledgment

### 3. TaskManager Module

**Location:** `consumer/TaskConsumer.java` + `service/TaskService.java`

**Purpose:** Persist generated replies as reviewable tasks

**Flow:**
1. Consume replies from Kafka `generated_replies` topic
2. Check for duplicate tweets
3. Create Task entity
4. Save to PostgreSQL
5. Mark as PENDING for review

**Key Methods:**
- `processReplySuggestion()` - Consumer method
- `createTask()` - Task creation
- `approveTask()` / `rejectTask()` - Task management

**Dependencies:**
- TaskRepository

**Task Statuses:**
- `PENDING` - Awaiting review
- `APPROVED` - Ready for posting
- `REJECTED` - Declined
- `POSTED` - Successfully posted (future)

### 4. ShortLink Service

**Location:** `service/ShortLinkService.java`

**Purpose:** Generate trackable short URLs

**Strategies:**

**A. Bitly Integration (Primary)**
- Uses Bitly API v4
- Requires authentication token
- Returns branded short links

**B. Fallback Method (Secondary)**
- Appends random hash as query parameter
- Format: `url?ref=RANDOM_HASH`
- No external dependencies

**Flow:**
1. Check for existing short link (cache)
2. Try Bitly API if token available
3. Fall back to query parameter method
4. Save to `short_link_log` table
5. Return short URL

**Key Methods:**
- `generateShortLink()` - Main method
- `createBitlyLink()` - Bitly integration
- `createFallbackLink()` - Fallback strategy

### 5. ChatGPT Service

**Location:** `service/ChatGPTService.java`

**Purpose:** Generate natural, human-like replies

**Prompt Engineering:**

**System Prompt:**
```
You are a creative social media marketer promoting Amazon Handmade 
products naturally. Your replies should be authentic, helpful, and 
conversational. Never use corporate language or obvious advertising tactics.
```

**User Prompt Structure:**
```
Tweet: "[original tweet text]"
Product: "[product title]"
Product Link: [short link]
Hashtags: #tag1 #tag2

Rules:
- Reply must sound human, friendly, and conversational
- Mention the product naturally and casually
- Include hashtags and link at the end
- Keep under 250 characters
- Don't be overly promotional or salesy
- Add value to the conversation
```

**Configuration:**
```yaml
openai:
  model: gpt-4o-mini
  temperature: 0.8
  max:
    tokens: 150
```

**Key Methods:**
- `generateResponse()` - Main API call
- `buildPrompt()` - Prompt construction
- `generateFallbackResponse()` - Error fallback

### 6. External Service Clients

#### CampaignClientService
**Purpose:** Fetch campaign data
**Endpoint:** `GET /api/campaigns?status=ACTIVE`
**Response:** List of CampaignDto

#### ProductClientService
**Purpose:** Fetch product data
**Endpoint:** `GET /api/products/{id}`
**Response:** ProductDto

**Technology:** WebClient (reactive)

## 🔄 Data Flow Diagrams

### Tweet Discovery Flow

```
[Scheduler Trigger] (every 30 min)
        │
        ▼
[Get Active Campaigns]
        │
        ▼
[For Each Campaign]
        │
        ├─▶ [Build Search Query]
        │
        ├─▶ [Search Twitter]
        │
        └─▶ [Publish to Kafka: new_tweets]
```

### Reply Generation Flow

```
[Kafka: new_tweets]
        │
        ▼
[Consume Tweet]
        │
        ├─▶ [Get Campaign Data] ───▶ campaign-service
        │
        ├─▶ [Get Product Data] ────▶ product-service
        │
        ├─▶ [Generate Short Link] ─▶ ShortLinkService
        │                                   │
        │                                   ├─▶ [Try Bitly API]
        │                                   │
        │                                   └─▶ [Fallback Method]
        │
        ├─▶ [Build ChatGPT Prompt]
        │
        ├─▶ [Call OpenAI API] ──────────▶ OpenAI
        │
        └─▶ [Publish to Kafka: generated_replies]
```

### Task Creation Flow

```
[Kafka: generated_replies]
        │
        ▼
[Consume Reply Suggestion]
        │
        ├─▶ [Check for Duplicate]
        │
        ├─▶ [Create Task Entity]
        │
        └─▶ [Save to PostgreSQL]
                │
                ▼
        [Task Status: PENDING]
```

## 🗄️ Database Schema

### tasks Table

| Column           | Type      | Description                |
|------------------|-----------|----------------------------|
| id               | BIGSERIAL | Primary key                |
| tweet_id         | VARCHAR   | Twitter tweet ID           |
| campaign_id      | BIGINT    | Associated campaign        |
| reply_text       | TEXT      | Generated reply            |
| mode             | VARCHAR   | AUTO or SEMI_AUTO          |
| status           | VARCHAR   | PENDING, APPROVED, etc.    |
| tweet_author     | VARCHAR   | Original tweet author      |
| tweet_text       | TEXT      | Original tweet content     |
| tweet_url        | VARCHAR   | Twitter URL                |
| confidence_score | DOUBLE    | AI confidence (0-1)        |
| short_link       | VARCHAR   | Generated short URL        |
| created_at       | TIMESTAMP | Creation time              |
| updated_at       | TIMESTAMP | Last update time           |

### short_link_log Table

| Column        | Type      | Description                |
|---------------|-----------|----------------------------|
| id            | BIGSERIAL | Primary key                |
| product_id    | BIGINT    | Associated product         |
| campaign_id   | BIGINT    | Associated campaign        |
| original_url  | VARCHAR   | Full Amazon URL            |
| short_url     | VARCHAR   | Generated short URL        |
| link_provider | VARCHAR   | BITLY or FALLBACK          |
| click_count   | INTEGER   | Tracking (future)          |
| created_at    | TIMESTAMP | Creation time              |

**Indexes:**
- `short_url` (unique)
- `tweet_id` (for duplicate checking)
- `campaign_id` (for queries)

## 📡 Kafka Topics

### new_tweets
- **Producer:** TweetScoutScheduler
- **Consumer:** ReplyGeneratorConsumer
- **Message Type:** Tweet
- **Partitions:** 3
- **Replication:** 1

### generated_replies
- **Producer:** ReplyGeneratorConsumer
- **Consumer:** TaskConsumer
- **Message Type:** ReplySuggestion
- **Partitions:** 3
- **Replication:** 1

### dead_letter
- **Producer:** Any consumer (error handling)
- **Consumer:** Monitoring system (future)
- **Message Type:** Any (failed messages)
- **Partitions:** 1
- **Replication:** 1

## 🔐 Security Considerations

### API Key Management
- OpenAI API key stored in environment variables
- Bitly token stored in environment variables
- Never committed to version control

### Database Security
- Connection pooling configured
- Prepared statements prevent SQL injection
- User permissions limited to necessary operations

### Inter-Service Communication
- HTTP communication (HTTPS in production)
- Service-to-service authentication (future)
- Rate limiting on external APIs

### Kafka Security
- Consumer group isolation
- Message acknowledgment for reliability
- Dead letter queue for failed messages

## 📊 Monitoring & Observability

### Logging
- Structured logging with context
- Log levels: DEBUG, INFO, WARN, ERROR
- Request/response logging for external services

### Metrics (Future)
- Tweet discovery rate
- Reply generation success rate
- ChatGPT API latency
- Task creation rate
- Consumer lag

### Health Checks
- `/api/health` endpoint
- Database connectivity
- Kafka connectivity
- External service availability

## 🚀 Scalability

### Horizontal Scaling
- Stateless service design
- Multiple consumer instances supported
- Kafka consumer group load balancing

### Vertical Scaling
- Configurable consumer concurrency
- Connection pool sizing
- JVM heap configuration

### Performance Optimization
- Database connection pooling
- Kafka batch processing
- Async I/O with WebClient
- Caching for frequently accessed data

## 🔄 Future Enhancements

### Phase 2: Auto-Posting
- Integrate with Twitter API v2
- Automatic posting for approved tasks
- Retry mechanism for failed posts

### Phase 3: Analytics
- Click tracking for short links
- Reply engagement metrics
- Campaign performance dashboard

### Phase 4: Advanced AI
- Multi-language support
- Sentiment analysis
- A/B testing for reply styles
- Personalization based on user context

### Phase 5: Optimization
- Machine learning for confidence scoring
- Predictive analytics for tweet discovery
- Dynamic scheduling based on engagement patterns

## 📚 Technology Stack Details

### Spring Boot 3
- Dependency Injection
- Auto-configuration
- Embedded Tomcat server

### Spring Kafka
- KafkaTemplate for producing
- @KafkaListener for consuming
- Consumer factory configuration

### Spring Data JPA
- Repository pattern
- Transaction management
- Entity lifecycle hooks

### WebClient
- Reactive HTTP client
- Non-blocking I/O
- Connection pooling

### Lombok
- Reduces boilerplate code
- @Data, @Builder, @Slf4j

### PostgreSQL
- Relational data storage
- ACID transactions
- Full-text search capability

### Kafka
- Distributed event streaming
- Fault tolerance
- Scalable message processing

---

This architecture provides a solid foundation for autonomous social media engagement with AI-powered reply generation.

