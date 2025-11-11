# Campaign Service

Campaign Service is a microservice for managing automated traffic campaigns in the Agentic Traffic Booster (ATB) platform.

## 🎯 Overview

This service defines campaigns that automate traffic actions for different platforms (Twitter, YouTube, Pinterest) linked to existing products. Each campaign specifies daily action limits and platform-specific configuration parameters stored as JSONB.

## 🛠 Technology Stack

- **Java**: 17
- **Spring Boot**: 3.2.0
- **Database**: PostgreSQL with JSONB support
- **ORM**: Spring Data JPA with Hibernate
- **Build Tool**: Maven
- **Port**: 8082

## 📋 Prerequisites

- Java 17 or higher
- Maven 3.6+
- PostgreSQL 12 or higher
- Running PostgreSQL instance on `localhost:5432`

## 🗄️ Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE atb_campaign;
```

2. Update credentials in `src/main/resources/application.properties` if needed:

```properties
spring.datasource.username=postgres
spring.datasource.password=postgres
```

## 🚀 Running the Service

### Using Maven

```bash
cd backend/campaign-service
mvn clean install
mvn spring-boot:run
```

### Using Java

```bash
mvn clean package
java -jar target/campaign-service-1.0.0.jar
```

The service will start on **port 8082**.

## 📡 API Endpoints

Base URL: `http://localhost:8082/api/campaigns`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | Get all campaigns |
| GET | `/api/campaigns/{id}` | Get campaign by ID |
| POST | `/api/campaigns` | Create new campaign |
| PATCH | `/api/campaigns/{id}/pause` | Pause a campaign |
| PATCH | `/api/campaigns/{id}/resume` | Resume a campaign |
| DELETE | `/api/campaigns/{id}` | Delete a campaign |
| GET | `/api/campaigns/channel-types` | Get available channel types |

## 📊 Data Model

### Campaign Entity

| Field | Type | Description |
|-------|------|-------------|
| id | Long | Primary key (auto-generated) |
| productId | Long | Reference to product |
| name | String | Campaign name (required) |
| channel | Enum | Marketing channel (TWITTER, YOUTUBE, PINTEREST) |
| startDate | LocalDate | Campaign start date (required) |
| endDate | LocalDate | Campaign end date (nullable) |
| dailyLimit | Integer | Daily action limit (required, positive) |
| status | Enum | Campaign status (DRAFT, ACTIVE, PAUSED, COMPLETED) |
| config | JSONB | Platform-specific configuration |
| createdAt | LocalDateTime | Creation timestamp |

### Enums

**Channel:**
- TWITTER
- YOUTUBE
- PINTEREST

**CampaignStatus:**
- DRAFT (default on creation)
- ACTIVE
- PAUSED
- COMPLETED

### Config Examples (JSONB)

**Twitter:**
```json
{
  "minFollowerCount": 500,
  "hashtags": ["#fyp", "#deal"]
}
```

**YouTube:**
```json
{
  "minSubscribers": 1000,
  "keywords": ["review", "unboxing"]
}
```

**Pinterest:**
```json
{
  "minFollowers": 300,
  "boards": ["Fashion", "Home Decor"]
}
```

## 🧪 Example API Requests

### Create a Twitter Campaign

```bash
curl -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "name": "Summer Sale Twitter Campaign",
    "channel": "TWITTER",
    "startDate": "2025-06-01",
    "endDate": "2025-08-31",
    "dailyLimit": 100,
    "config": {
      "minFollowerCount": 500,
      "hashtags": ["#sale", "#summer"]
    }
  }'
```

### Create a YouTube Campaign

```bash
curl -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 2,
    "name": "Product Review Campaign",
    "channel": "YOUTUBE",
    "startDate": "2025-12-01",
    "dailyLimit": 50,
    "config": {
      "minSubscribers": 1000,
      "keywords": ["review", "unboxing", "tech"]
    }
  }'
```

### Get All Campaigns

```bash
curl http://localhost:8082/api/campaigns
```

### Get Campaign by ID

```bash
curl http://localhost:8082/api/campaigns/1
```

### Get Channel Types

```bash
curl http://localhost:8082/api/campaigns/channel-types
```

### Pause a Campaign

```bash
curl -X PATCH http://localhost:8082/api/campaigns/1/pause
```

### Resume a Campaign

```bash
curl -X PATCH http://localhost:8082/api/campaigns/1/resume
```

### Delete a Campaign

```bash
curl -X DELETE http://localhost:8082/api/campaigns/1
```

## 🏗️ Architecture

```
campaign-service/
├── src/main/java/com/atb/campaignservice/
│   ├── CampaignServiceApplication.java     # Main application
│   ├── config/
│   │   └── WebConfig.java                  # CORS configuration
│   ├── controller/
│   │   └── CampaignController.java         # REST endpoints
│   ├── dto/
│   │   ├── CampaignRequest.java            # Request DTO
│   │   ├── CampaignResponse.java           # Response DTO
│   │   └── ChannelTypeResponse.java        # Channel type DTO
│   ├── entity/
│   │   └── Campaign.java                   # JPA entity
│   ├── enums/
│   │   ├── CampaignStatus.java             # Status enum
│   │   └── Channel.java                    # Channel enum
│   ├── exception/
│   │   ├── ErrorResponse.java              # Error response DTO
│   │   ├── GlobalExceptionHandler.java     # Global exception handler
│   │   ├── InvalidOperationException.java  # Custom exception
│   │   └── ResourceNotFoundException.java  # Custom exception
│   ├── repository/
│   │   └── CampaignRepository.java         # JPA repository
│   └── service/
│       └── CampaignService.java            # Business logic
└── src/main/resources/
    └── application.properties              # Configuration
```

## 🛡️ Exception Handling

The service includes global exception handling with proper HTTP status codes:

- **404 Not Found**: Campaign not found
- **400 Bad Request**: Invalid request data or business rule violation
- **201 Created**: Campaign successfully created
- **204 No Content**: Campaign successfully deleted
- **500 Internal Server Error**: Unexpected errors

### Error Response Format

```json
{
  "timestamp": "2025-11-11T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Campaign not found with id: 1",
  "path": "/api/campaigns/1"
}
```

## ⚙️ Business Rules

1. **Default Status**: All campaigns are created with `DRAFT` status
2. **Pause Operation**: Only `ACTIVE` campaigns can be paused
3. **Resume Operation**: `COMPLETED` campaigns cannot be resumed
4. **Date Validation**: End date (if provided) must be after start date
5. **Daily Limit**: Must be a positive integer

## 🌐 CORS Configuration

CORS is configured to allow requests from:
- `http://localhost:3000` (Frontend application)

Allowed methods: GET, POST, PUT, DELETE, PATCH, OPTIONS

## 🔮 Future Enhancements

- Integration with Product Service for product validation
- Integration with Analytics Service for campaign metrics
- Webhook notifications for status changes
- Scheduled jobs for automatic campaign completion based on end date
- Campaign budget tracking and alerts
- Real-time action tracking against daily limits
- Campaign performance analytics

## 🐛 Troubleshooting

### Database Connection Error

Ensure PostgreSQL is running and the database exists:

```bash
psql -U postgres
CREATE DATABASE atb_campaign;
\q
```

### Port Already in Use

Change the port in `application.properties`:

```properties
server.port=8083
```

## 📝 License

Proprietary - Agentic Traffic Booster Platform

