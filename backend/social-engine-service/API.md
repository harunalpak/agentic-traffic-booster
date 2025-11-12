# Social Engine Service - API Documentation

## Base URL

```
http://localhost:8083/api
```

## Endpoints

### Health Check

#### GET /health

Check service health and status.

**Response:**
```json
{
  "status": "UP",
  "service": "social-engine-service",
  "timestamp": "2024-11-12T10:30:00",
  "version": "1.0.0"
}
```

**Status Codes:**
- `200 OK` - Service is healthy

---

## Task Management

### Get Pending Tasks

#### GET /tasks/pending

Retrieve all tasks awaiting review.

**Response:**
```json
[
  {
    "id": 1,
    "tweetId": "1234567890",
    "campaignId": 1,
    "replyText": "Love handmade gifts! Check out this Funny Christmas Shirt...",
    "mode": "SEMI_AUTO",
    "status": "PENDING",
    "tweetAuthor": "user_0",
    "tweetText": "Looking for handmade Christmas gifts! Any recommendations?",
    "tweetUrl": "https://twitter.com/i/web/status/1234567890",
    "confidenceScore": 0.85,
    "shortLink": "https://amzn.to/Xyz123",
    "createdAt": "2024-11-12T10:00:00",
    "updatedAt": null
  }
]
```

**Status Codes:**
- `200 OK` - Success

---

### Get Tasks by Campaign

#### GET /tasks/campaign/{campaignId}

Retrieve all tasks for a specific campaign.

**Path Parameters:**
- `campaignId` (Long) - Campaign ID

**Example:**
```bash
curl http://localhost:8083/api/tasks/campaign/1
```

**Response:**
```json
[
  {
    "id": 1,
    "tweetId": "1234567890",
    "campaignId": 1,
    "replyText": "...",
    "mode": "SEMI_AUTO",
    "status": "PENDING",
    ...
  }
]
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Campaign not found

---

### Approve Task

#### POST /tasks/{taskId}/approve

Approve a task for posting.

**Path Parameters:**
- `taskId` (Long) - Task ID

**Example:**
```bash
curl -X POST http://localhost:8083/api/tasks/1/approve
```

**Response:**
- Empty body with status 200

**Status Codes:**
- `200 OK` - Task approved
- `404 Not Found` - Task not found

---

### Reject Task

#### POST /tasks/{taskId}/reject

Reject a task.

**Path Parameters:**
- `taskId` (Long) - Task ID

**Example:**
```bash
curl -X POST http://localhost:8083/api/tasks/1/reject
```

**Response:**
- Empty body with status 200

**Status Codes:**
- `200 OK` - Task rejected
- `404 Not Found` - Task not found

---

### Update Task Status

#### PUT /tasks/{taskId}/status

Update task status to a custom value.

**Path Parameters:**
- `taskId` (Long) - Task ID

**Query Parameters:**
- `status` (String) - New status (PENDING, APPROVED, REJECTED, POSTED)

**Example:**
```bash
curl -X PUT "http://localhost:8083/api/tasks/1/status?status=APPROVED"
```

**Response:**
- Empty body with status 200

**Status Codes:**
- `200 OK` - Status updated
- `404 Not Found` - Task not found
- `400 Bad Request` - Invalid status

---

## Data Models

### Task

```json
{
  "id": Long,
  "tweetId": String,
  "campaignId": Long,
  "replyText": String,
  "mode": String,           // "AUTO" | "SEMI_AUTO"
  "status": String,         // "PENDING" | "APPROVED" | "REJECTED" | "POSTED"
  "tweetAuthor": String,
  "tweetText": String,
  "tweetUrl": String,
  "confidenceScore": Double,
  "shortLink": String,
  "createdAt": DateTime,
  "updatedAt": DateTime
}
```

### Tweet (Internal Kafka Message)

```json
{
  "tweetId": String,
  "campaignId": Long,
  "author": String,
  "text": String,
  "url": String,
  "likes": Integer,
  "retweets": Integer,
  "language": String,
  "createdAt": DateTime
}
```

### ReplySuggestion (Internal Kafka Message)

```json
{
  "tweetId": String,
  "campaignId": Long,
  "replyText": String,
  "confidence": Double,
  "shortLink": String,
  "tweetAuthor": String,
  "tweetText": String,
  "tweetUrl": String,
  "mode": String,
  "createdAt": DateTime
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "timestamp": "2024-11-12T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Task not found with id: 999",
  "path": "/api/tasks/999"
}
```

### Common Error Codes

- `400 Bad Request` - Invalid input
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Integration Examples

### Python

```python
import requests

# Get pending tasks
response = requests.get('http://localhost:8083/api/tasks/pending')
tasks = response.json()

# Approve a task
task_id = tasks[0]['id']
requests.post(f'http://localhost:8083/api/tasks/{task_id}/approve')
```

### JavaScript

```javascript
// Get pending tasks
const response = await fetch('http://localhost:8083/api/tasks/pending');
const tasks = await response.json();

// Approve a task
const taskId = tasks[0].id;
await fetch(`http://localhost:8083/api/tasks/${taskId}/approve`, {
  method: 'POST'
});
```

### cURL

```bash
# Get pending tasks
curl http://localhost:8083/api/tasks/pending

# Approve task
curl -X POST http://localhost:8083/api/tasks/1/approve

# Reject task
curl -X POST http://localhost:8083/api/tasks/2/reject

# Update status
curl -X PUT "http://localhost:8083/api/tasks/1/status?status=POSTED"
```

---

## Rate Limits

Currently no rate limits enforced. Recommended for production:

- 100 requests/minute per IP
- 1000 requests/hour per IP

---

## Authentication

Currently no authentication required. Recommended for production:

- JWT token authentication
- API key authentication
- OAuth 2.0

---

## CORS

CORS is currently enabled for all origins (`*`). 

Configure in `TaskController.java`:
```java
@CrossOrigin(origins = "*")
```

For production, restrict to specific origins:
```java
@CrossOrigin(origins = "https://yourdomain.com")
```

---

## Monitoring

### Prometheus Metrics (Future)

- `tasks_created_total` - Total tasks created
- `tasks_approved_total` - Total tasks approved
- `tasks_rejected_total` - Total tasks rejected
- `chatgpt_api_latency_seconds` - ChatGPT API latency
- `kafka_consumer_lag` - Consumer lag

### Health Checks

Use `/api/health` for:
- Load balancer health checks
- Kubernetes liveness probes
- Monitoring systems

Example Kubernetes config:
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 8083
  initialDelaySeconds: 30
  periodSeconds: 10
```

---

## Versioning

Current API version: `v1`

Future versions will be prefixed:
- `/api/v1/tasks`
- `/api/v2/tasks`

---

## Support

For issues or questions:
- Check logs: `logs/social-engine-service.log`
- Review documentation: `README.md`
- Architecture details: `ARCHITECTURE.md`

