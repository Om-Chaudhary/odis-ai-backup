---
sidebar_position: 1
title: API Overview
description: ODIS AI API documentation
---

# API Overview

ODIS AI provides a REST API for programmatic access to your voice agents and call data.

## Base URL

```
https://api.odis.ai/v1
```

## Authentication

All API requests require authentication using an API key:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.odis.ai/v1/calls
```

### Getting Your API Key

1. Go to [Dashboard → Settings → API](https://odis.ai/dashboard/settings/api)
2. Click **Generate API Key**
3. Copy and securely store your key

:::warning
Never expose your API key in client-side code or public repositories.
:::

## Response Format

All responses are JSON formatted:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

### Error Responses

```json
{
  "success": false,
  "error": {
    "code": "invalid_request",
    "message": "Missing required field: phone_number"
  }
}
```

## Rate Limits

| Plan         | Requests/minute |
| ------------ | --------------- |
| Starter      | 60              |
| Professional | 300             |
| Enterprise   | 1000            |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

## Endpoints

### Calls

| Method | Endpoint     | Description            |
| ------ | ------------ | ---------------------- |
| GET    | `/calls`     | List all calls         |
| GET    | `/calls/:id` | Get call details       |
| POST   | `/calls`     | Initiate outbound call |

### Agents

| Method | Endpoint      | Description      |
| ------ | ------------- | ---------------- |
| GET    | `/agents`     | List all agents  |
| GET    | `/agents/:id` | Get agent config |
| PATCH  | `/agents/:id` | Update agent     |

### Webhooks

| Method | Endpoint        | Description    |
| ------ | --------------- | -------------- |
| GET    | `/webhooks`     | List webhooks  |
| POST   | `/webhooks`     | Create webhook |
| DELETE | `/webhooks/:id` | Delete webhook |

## SDKs

Official SDKs are available for:

- **JavaScript/TypeScript** - `npm install @odis-ai/sdk`
- **Python** - `pip install odis-ai`

```typescript
import { OdisClient } from "@odis-ai/sdk";

const client = new OdisClient({ apiKey: "your_api_key" });

const calls = await client.calls.list({ limit: 10 });
```
