# Agentic Traffic Booster - Backend Microservices Overview

## 🏗️ Architecture

The ATB backend consists of multiple microservices working together through event-driven architecture (Kafka) and REST APIs.

```
┌─────────────────────────────────────────────────────────────────┐
│                      ATB Backend Services                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐     ┌──────────────────────┐
│  campaign-service    │     │  product-service     │
│     (Java/Spring)    │     │    (Java/Spring)     │
│     Port: 8082       │     │    Port: 8080        │
└──────────┬───────────┘     └──────────┬───────────┘
           │                            │
           │ REST API                   │ REST API
           │                            │
           ▼                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    tweet-scout-service                            │
│                      (Node.js)                                    │
│                                                                   │
│  ┌────────────┐    ┌─────────────┐    ┌──────────────┐         │
│  │  Scheduler │───▶│  Campaign   │───▶│    Tweet     │         │
│  │ (node-cron)│    │   Client    │    │   Scraper    │         │
│  └────────────┘    └─────────────┘    └──────────────┘         │
│         │                                       │                 │
│         └───────────────────────────────────────┘                 │
│                           │                                       │
│                           ▼                                       │
│                  ┌─────────────────┐                             │
│                  │ Kafka Producer  │                             │
│                  └─────────────────┘                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
                ┌──────────────────┐
                │      Kafka       │
                │  Topic:          │
                │  new_tweets      │
                └────────┬─────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│                  social-engine-service                              │
│                      (Java/Spring)                                  │
│                      Port: 8083                                     │
│                                                                     │
│  ┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │ ReplyGenerator  │───▶│   ChatGPT    │───▶│  TaskManager    │  │
│  │   (Consumer)    │    │   Service    │    │   (Consumer)    │  │
│  └─────────────────┘    └──────────────┘    └─────────────────┘  │
│          │                      │                     │            │
│          │                      ▼                     ▼            │
│          │              ┌──────────────┐      ┌─────────────┐     │
│          └─────────────▶│  ShortLink   │      │ PostgreSQL  │     │
│                         │   Service    │      │   Database  │     │
│                         └──────────────┘      └─────────────┘     │
└────────────────────────────────────────────────────────────────────┘
```

## 📦 Service Inventory

| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| **campaign-service** | Java 21 + Spring Boot 3 | 8082 | Campaign management |
| **product-service** | Java 21 + Spring Boot 3 | 8080 | Product catalog & Amazon integration |
| **tweet-scout-service** | Node.js 20 | - | Tweet discovery & Kafka publishing |
| **social-engine-service** | Java 21 + Spring Boot 3 | 8083 | Reply generation & task management |

## 🔄 Data Flow

### Complete End-to-End Flow

```
1. User creates campaign (campaign-service)
   └─► Campaign stored in database
   
2. TweetScout scheduler runs (every 30 min)
   ├─► Fetches active campaigns (campaign-service)
   ├─► Scrapes relevant tweets (Twitter)
   └─► Publishes to Kafka (new_tweets) ✅
   
3. ReplyGenerator consumes tweets
   ├─► Fetches campaign details (campaign-service)
   ├─► Fetches product info (product-service)
   ├─► Generates short link (Bitly API)
   ├─► Creates AI reply (OpenAI API)
   └─► Publishes to Kafka (generated_replies) ✅ Fully Event-Driven
   
4. TaskConsumer consumes replies
   ├─► Saves task to PostgreSQL
   └─► Status: PENDING (awaiting review)
   
5. User reviews tasks via REST API
   ├─► GET /api/tasks/pending
   ├─► POST /api/tasks/{id}/approve
   └─► Status: APPROVED
   
6. (Future) Traffic Engine posts tweets
   └─► Automatically posts approved replies

📌 Key: ✅ = Kafka-based (fully asynchronous)
       The entire pipeline from tweet discovery to task creation
       is now 100% event-driven through Kafka.
```

## 🧩 Service Details

### 1. campaign-service

**Technology:** Java 21, Spring Boot 3, PostgreSQL  
**Port:** 8082  
**Database:** PostgreSQL

**Responsibilities:**
- Campaign CRUD operations
- Campaign status management (ACTIVE, PAUSED, COMPLETED)
- Campaign configuration (hashtags, keywords, mode)
- Channel management (Twitter, Facebook, etc.)

**Key Endpoints:**
- `GET /api/campaigns` - List campaigns
- `GET /api/campaigns/{id}` - Get campaign
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/{id}` - Update campaign
- `GET /api/campaigns?status=ACTIVE` - Get active campaigns

---

### 2. product-service

**Technology:** Java 21, Spring Boot 3, PostgreSQL, AWS S3  
**Port:** 8080  
**Database:** PostgreSQL  
**Storage:** AWS S3

**Responsibilities:**
- Product catalog management
- Amazon URL validation
- Product images (S3)
- Product categories

**Key Endpoints:**
- `GET /api/products` - List products
- `GET /api/products/{id}` - Get product
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product

---

### 3. tweet-scout-service ⭐ NEW

**Technology:** Node.js 20, KafkaJS, @the-convocation/twitter-scraper  
**Port:** N/A (background service)  
**Dependencies:** campaign-service, Kafka

**Responsibilities:**
- Scheduled tweet discovery (cron)
- Twitter scraping via library
- Search query construction
- Kafka message publishing

**Configuration:**
- `SCRAPE_INTERVAL_MINUTES=30` - Execution frequency
- `MAX_TWEETS_PER_CAMPAIGN=10` - Tweets per campaign
- `USE_MOCK_TWEETS=false` - Mock data for testing

**Published Kafka Topics:**
- `new_tweets` - Discovered tweets
- `dead_letter` - Failed messages

**Key Components:**
- `scoutScheduler.js` - Cron scheduler
- `campaignClient.js` - HTTP client for campaigns
- `tweetScraper.js` - Twitter scraping logic
- `tweetPublisher.js` - Kafka producer

---

### 4. social-engine-service

**Technology:** Java 21, Spring Boot 3, Kafka, PostgreSQL  
**Port:** 8083  
**Database:** PostgreSQL  
**Dependencies:** campaign-service, product-service, OpenAI API, Bitly API

**Responsibilities:**
- Consume tweets from Kafka
- Generate AI-powered replies (ChatGPT)
- Create short links (Bitly)
- Task management for review
- REST API for task operations

**Consumed Kafka Topics:**
- `new_tweets` - From tweet-scout-service

**Published Kafka Topics:**
- `generated_replies` - AI-generated replies
- `dead_letter` - Failed messages

**Key Endpoints:**
- `GET /api/health` - Health check
- `GET /api/tasks/pending` - Pending tasks
- `GET /api/tasks/campaign/{id}` - Tasks by campaign
- `POST /api/tasks/{id}/approve` - Approve task
- `POST /api/tasks/{id}/reject` - Reject task

**Key Components:**
- `ReplyGeneratorConsumer` - Kafka consumer
- `ChatGPTService` - OpenAI integration
- `ShortLinkService` - Bitly integration
- `TaskService` - Task management
- `TaskConsumer` - Reply consumer

---

## 🔌 Inter-Service Communication

### REST API (Synchronous)

```
tweet-scout-service  ──HTTP──▶ campaign-service
social-engine-service ──HTTP──▶ campaign-service
social-engine-service ──HTTP──▶ product-service
```

### Kafka (Asynchronous)

```
tweet-scout-service ──Kafka──▶ social-engine-service
                    (new_tweets)

social-engine-service ──Kafka──▶ (internal)
                     (generated_replies)
```

### External APIs

```
social-engine-service ──HTTPS──▶ OpenAI API (ChatGPT)
social-engine-service ──HTTPS──▶ Bitly API (Short Links)
tweet-scout-service   ──Web───▶ Twitter (via Scraper)
```

## 📊 Kafka Topics

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `new_tweets` | tweet-scout-service | social-engine-service | Discovered tweets |
| `generated_replies` | social-engine-service | social-engine-service | AI-generated replies |
| `dead_letter` | Any service | Monitoring | Failed messages |

## 🗄️ Databases

### PostgreSQL Databases

1. **atb_campaigns** (campaign-service)
   - campaigns table

2. **atb_products** (product-service)
   - products table

3. **atb_social** (social-engine-service)
   - tasks table
   - short_link_log table

## 🚀 Deployment

### Local Development

```bash
# 1. Start Infrastructure
docker run -d -p 5432:5432 postgres:14
docker run -d -p 9092:9092 apache/kafka:latest

# 2. Start Services
cd backend/campaign-service && mvn spring-boot:run &
cd backend/product-service && mvn spring-boot:run &
cd backend/tweet-scout-service && npm start &
cd backend/social-engine-service && mvn spring-boot:run &
```

### Docker Compose

```bash
# All services in one command
docker-compose up -d

# Specific service
docker-compose up -d tweet-scout-service
```

### Production (Kubernetes)

```bash
# Apply all manifests
kubectl apply -f k8s/

# Services will auto-discover via Kubernetes DNS
```

## 📋 Environment Variables

### Global Variables

```bash
# Kafka
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_BROKERS=localhost:9092

# Service URLs
CAMPAIGN_SERVICE_URL=http://localhost:8082
PRODUCT_SERVICE_URL=http://localhost:8080
```

### Service-Specific

**tweet-scout-service:**
```bash
SCRAPE_INTERVAL_MINUTES=30
MAX_TWEETS_PER_CAMPAIGN=10
USE_MOCK_TWEETS=false
RUN_ON_STARTUP=true
```

**social-engine-service:**
```bash
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
BITLY_TOKEN=your-token
```

## 🔄 Recent Changes

### ✅ TweetScout Refactoring (November 2024)

**Before:**
- TweetScout was a `@Scheduled` component in `social-engine-service` (Java)
- Used subprocess to call Node.js Twitter Scraper
- Tightly coupled with Java service

**After:**
- **tweet-scout-service** is now an independent Node.js microservice
- Native Twitter Scraper integration
- Communicates via Kafka only
- Independent deployment and scaling

**Migration Impact:**
- ✅ Zero downtime migration
- ✅ Backward compatible (Kafka messages unchanged)
- ✅ No changes needed in social-engine-service consumer
- ✅ Better performance and maintainability

**Files Removed:**
- `social-engine-service/.../TweetScoutScheduler.java` ❌ DELETED

**Files Added:**
- `tweet-scout-service/` (complete new service) ✅

---

### ✅ Kafka Pipeline Refactoring (November 2024)

**Before:**
- `ReplyGeneratorConsumer` saved directly to database via `TaskService`
- Mixed synchronous and asynchronous patterns
- Tight coupling between reply generation and persistence

**After:**
- **ReplyGeneratorConsumer** now publishes to Kafka (`generated_replies` topic)
- **TaskConsumer** handles database persistence
- Fully event-driven architecture
- Complete decoupling of concerns

**Migration Impact:**
- ✅ Zero downtime migration
- ✅ Backward compatible (same final behavior)
- ✅ Better scalability (independent scaling)
- ✅ Improved fault tolerance (Kafka buffering)
- ✅ Enhanced observability (monitor each stage)

**Files Modified:**
- `ReplyGeneratorConsumer.java` - Now publishes to Kafka instead of DB
- `README.md` - Updated architecture diagrams

**Files Already in Place:**
- `TaskConsumer.java` - Already consuming from `generated_replies`
- `KafkaConfig.java` - Already configured for ReplySuggestion messages

**Documentation Added:**
- `KAFKA_REFACTORING.md` - Complete refactoring guide ✅

## 🧪 Testing Strategy

### Unit Tests

```bash
# Java services
mvn test

# Node.js services
npm test
```

### Integration Tests

```bash
# Test service communication
./scripts/test-integration.sh
```

### End-to-End Tests

```bash
# Full flow test
./scripts/test-e2e.sh
```

## 📊 Monitoring

### Health Checks

```bash
curl http://localhost:8082/api/health  # campaign-service
curl http://localhost:8080/api/health  # product-service
curl http://localhost:8083/api/health  # social-engine-service
```

### Kafka Monitoring

```bash
# List topics
kafka-topics.sh --bootstrap-server localhost:9092 --list

# Monitor messages
kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic new_tweets \
  --from-beginning
```

### Database Monitoring

```bash
# Check task counts
psql -U postgres atb_social -c "SELECT status, COUNT(*) FROM tasks GROUP BY status;"

# Check short links
psql -U postgres atb_social -c "SELECT COUNT(*) FROM short_link_log;"
```

## 🔐 Security

### Current Implementation

✅ Environment-based configuration  
✅ Non-root Docker users  
✅ Error handling with DLQ  
✅ Input validation  

### Production Recommendations

- [ ] HTTPS/TLS for all services
- [ ] API authentication (JWT)
- [ ] Kafka SSL/SASL
- [ ] Secrets manager (Vault, AWS Secrets Manager)
- [ ] Network policies
- [ ] Rate limiting
- [ ] Audit logging

## 📈 Performance

| Service | Memory | CPU | Startup Time |
|---------|--------|-----|--------------|
| campaign-service | 512MB | Low | ~20s |
| product-service | 512MB | Low | ~20s |
| tweet-scout-service | 100MB | Low | ~3s |
| social-engine-service | 1GB | Medium | ~30s |

## 🔄 Future Roadmap

### Phase 2
- [ ] **traffic-engine** - Automated tweet posting
- [ ] Real-time tweet streaming (Twitter API v2)
- [ ] Reply performance analytics
- [ ] A/B testing for reply strategies

### Phase 3
- [ ] Multi-platform support (Facebook, Instagram)
- [ ] Machine learning for reply optimization
- [ ] Sentiment analysis
- [ ] Advanced campaign scheduling

### Phase 4
- [ ] Auto-scaling based on load
- [ ] Multi-region deployment
- [ ] Advanced analytics dashboard
- [ ] AI-powered campaign suggestions

## 📚 Documentation

### Service Documentation

- [campaign-service README](campaign-service/README.md)
- [product-service README](product-service/README.md)
- [tweet-scout-service README](tweet-scout-service/README.md)
- [social-engine-service README](social-engine-service/README.md)

### Architecture Documentation

- [tweet-scout-service ARCHITECTURE](tweet-scout-service/ARCHITECTURE.md)
- [social-engine-service ARCHITECTURE](social-engine-service/ARCHITECTURE.md)
- [Migration Guide](tweet-scout-service/MIGRATION_GUIDE.md)

### Quick Start Guides

- [tweet-scout-service QUICKSTART](tweet-scout-service/QUICKSTART.md)
- [social-engine-service QUICKSTART](social-engine-service/QUICKSTART.md)

## 🎯 Quick Start (All Services)

```bash
# 1. Clone repository
git clone <repo-url>
cd agentic-traffic-booster

# 2. Start infrastructure
docker-compose up -d postgres kafka

# 3. Configure environment
cp backend/*/.env.example backend/*/.env
# Edit .env files with your API keys

# 4. Start services
cd backend/campaign-service && mvn spring-boot:run &
cd backend/product-service && mvn spring-boot:run &
cd backend/tweet-scout-service && npm install && npm start &
cd backend/social-engine-service && mvn spring-boot:run &

# 5. Verify
curl http://localhost:8082/api/health  # campaign
curl http://localhost:8080/api/health  # product
curl http://localhost:8083/api/health  # social-engine

# 6. Check logs
docker-compose logs -f
```

## 📞 Support

For questions or issues:
- Check individual service README files
- Review architecture documentation
- Check troubleshooting sections
- Refer to migration guides

---

**Architecture Version:** 2.0 (Post-TweetScout Refactoring)  
**Last Updated:** November 2024  
**Total Services:** 4 microservices  
**Total Lines of Code:** ~10,000+ lines

