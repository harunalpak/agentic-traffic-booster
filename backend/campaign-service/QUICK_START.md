# Campaign Service - Quick Start Guide

## 🚀 Quick Setup (3 Steps)

### Step 1: Create Database

```bash
psql -U postgres
```

```sql
CREATE DATABASE atb_campaign;
\q
```

### Step 2: Run the Service

```bash
cd backend/campaign-service
mvn spring-boot:run
```

Wait for: `Started CampaignServiceApplication in X.XXX seconds`

### Step 3: Test It

```bash
# Get all campaigns (should return empty array initially)
curl http://localhost:8082/api/campaigns

# Get available channel types
curl http://localhost:8082/api/campaigns/channel-types
```

## 📝 Create Your First Campaign

### Twitter Campaign

```bash
curl -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "name": "My First Twitter Campaign",
    "channel": "TWITTER",
    "startDate": "2025-12-01",
    "dailyLimit": 100,
    "config": {
      "minFollowerCount": 500,
      "hashtags": ["#promo", "#sale"]
    }
  }'
```

### YouTube Campaign

```bash
curl -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "name": "YouTube Review Campaign",
    "channel": "YOUTUBE",
    "startDate": "2025-12-01",
    "endDate": "2025-12-31",
    "dailyLimit": 50,
    "config": {
      "minSubscribers": 1000,
      "keywords": ["review", "unboxing"]
    }
  }'
```

### Pinterest Campaign

```bash
curl -X POST http://localhost:8082/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "name": "Pinterest Visual Campaign",
    "channel": "PINTEREST",
    "startDate": "2025-12-01",
    "dailyLimit": 75,
    "config": {
      "minFollowers": 300,
      "boards": ["Fashion", "Lifestyle"]
    }
  }'
```

## 🎮 Status Management

Assuming you created a campaign with ID 1:

```bash
# Initially status is DRAFT

# Resume to make it ACTIVE
curl -X PATCH http://localhost:8082/api/campaigns/1/resume

# Pause it (must be ACTIVE first)
curl -X PATCH http://localhost:8082/api/campaigns/1/pause

# Resume again
curl -X PATCH http://localhost:8082/api/campaigns/1/resume
```

## 🔍 Query Operations

```bash
# Get all campaigns
curl http://localhost:8082/api/campaigns

# Get specific campaign
curl http://localhost:8082/api/campaigns/1

# Get channel types (metadata)
curl http://localhost:8082/api/campaigns/channel-types
```

## 🗑️ Delete Campaign

```bash
curl -X DELETE http://localhost:8082/api/campaigns/1
```

## 📊 Expected Response Format

### Campaign Response

```json
{
  "id": 1,
  "productId": 1,
  "name": "My First Twitter Campaign",
  "channel": "TWITTER",
  "startDate": "2025-12-01",
  "endDate": null,
  "dailyLimit": 100,
  "status": "DRAFT",
  "config": {
    "minFollowerCount": 500,
    "hashtags": ["#promo", "#sale"]
  },
  "createdAt": "2025-11-11T10:30:00"
}
```

### Channel Types Response

```json
[
  {
    "name": "TWITTER",
    "displayName": "Twitter",
    "description": "Automate Twitter engagement and traffic",
    "configFields": ["minFollowerCount", "hashtags"]
  },
  {
    "name": "YOUTUBE",
    "displayName": "YouTube",
    "description": "Automate YouTube engagement and traffic",
    "configFields": ["minSubscribers", "keywords"]
  },
  {
    "name": "PINTEREST",
    "displayName": "Pinterest",
    "description": "Automate Pinterest engagement and traffic",
    "configFields": ["minFollowers", "boards"]
  }
]
```

## ❌ Error Responses

### Resource Not Found (404)

```json
{
  "timestamp": "2025-11-11T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Campaign not found with id: 999",
  "path": "/api/campaigns/999"
}
```

### Validation Error (400)

```json
{
  "timestamp": "2025-11-11T10:30:00",
  "status": 400,
  "error": "Validation Failed",
  "errors": {
    "name": "Campaign name is required",
    "dailyLimit": "Daily limit must be positive"
  },
  "path": "/api/campaigns"
}
```

### Business Rule Violation (400)

```json
{
  "timestamp": "2025-11-11T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Only ACTIVE campaigns can be paused",
  "path": "/api/campaigns/1/pause"
}
```

## 🔧 Troubleshooting

### Database Connection Error

```
Cannot create PoolableConnectionFactory
```

**Solution:**
1. Check PostgreSQL is running: `pg_ctl status`
2. Verify database exists: `psql -U postgres -l`
3. Check credentials in `application.properties`

### Port Already in Use

```
Port 8082 is already in use
```

**Solution:**
- Stop other service on port 8082
- Or change port: edit `application.properties` → `server.port=8083`

## 🌐 Frontend Integration

Example React/Next.js code:

```typescript
// Create campaign
const createCampaign = async (data) => {
  const response = await fetch('http://localhost:8082/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await response.json();
};

// Get all campaigns
const getCampaigns = async () => {
  const response = await fetch('http://localhost:8082/api/campaigns');
  return await response.json();
};

// Pause campaign
const pauseCampaign = async (id) => {
  const response = await fetch(`http://localhost:8082/api/campaigns/${id}/pause`, {
    method: 'PATCH'
  });
  return await response.json();
};
```

## ✅ Verification Checklist

- [ ] PostgreSQL is running
- [ ] Database `atb_campaign` exists
- [ ] Service starts on port 8082
- [ ] GET `/api/campaigns` returns `[]`
- [ ] GET `/api/campaigns/channel-types` returns channel metadata
- [ ] POST creates campaign with status `DRAFT`
- [ ] PATCH operations work for status changes
- [ ] DELETE removes campaigns
- [ ] CORS allows requests from `http://localhost:3000`

## 📚 Additional Resources

- [Full README](./README.md) - Complete documentation
- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)

---

**Status:** ✅ Service Ready for Development

