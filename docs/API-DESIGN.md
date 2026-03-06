# Voxtera — API Design

## Base URL

```
/api
```

All endpoints return JSON. Error responses follow the format:
```json
{ "error": "Human-readable message" }
```

---

## Health

### `GET /api/health`

Returns server and database health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "db": "connected"
}
```

---

## Surveys (Employee-facing)

### `GET /api/surveys/:token`

Get survey data via anonymous access token. Used by the employee survey page.

**Response:**
```json
{
  "survey": {
    "id": 1,
    "title": "Q1 Employee Satisfaction",
    "description": "...",
    "company": { "name": "Nordic Tech Solutions" }
  },
  "questions": [
    {
      "id": 1,
      "text": "I feel valued at work",
      "type": "rating",
      "order_position": 1,
      "required": true,
      "config": { "min": 1, "max": 5, "min_label": "Strongly Disagree", "max_label": "Strongly Agree" }
    }
  ],
  "organizationalLevels": [
    { "id": 1, "name": "Engineering", "type": "department" }
  ]
}
```

### `POST /api/surveys/:token/start`

Start a survey session. Returns a session ID for tracking anonymous responses.

**Request:**
```json
{
  "organizationalLevelId": 3
}
```

**Response:**
```json
{
  "responseId": 42,
  "sessionId": "anon-session-uuid"
}
```

### `POST /api/surveys/:token/answer`

Submit an answer to a question.

**Request:**
```json
{
  "responseId": 42,
  "questionId": 1,
  "ratingValue": 4
}
```

or for open text:
```json
{
  "responseId": 42,
  "questionId": 5,
  "textValue": "I really enjoy the team culture here."
}
```

**Response:**
```json
{ "success": true }
```

### `POST /api/surveys/:token/complete`

Mark a survey response as completed.

**Request:**
```json
{ "responseId": 42 }
```

**Response:**
```json
{ "success": true }
```

---

## Dashboard (Management-facing)

### `GET /api/dashboard/companies`

List all companies (for demo/admin use).

**Response:**
```json
[
  { "id": 1, "name": "Nordic Tech Solutions", "slug": "nordic-tech" }
]
```

### `GET /api/dashboard/companies/:companyId/overview`

Get high-level metrics for a company's latest survey.

**Response:**
```json
{
  "company": { "id": 1, "name": "Nordic Tech Solutions" },
  "survey": { "id": 1, "title": "Q1 2024 Survey" },
  "metrics": {
    "responseRate": 78,
    "totalResponses": 22,
    "averageScore": 3.8,
    "enpsScore": 32,
    "areasOfConcern": 2
  }
}
```

### `GET /api/dashboard/companies/:companyId/surveys/:surveyId/results`

Detailed results for a survey, broken down by question.

**Query params:** `?levelId=3` (optional, filter by org level)

**Response:**
```json
{
  "questions": [
    {
      "id": 1,
      "text": "I feel valued at work",
      "type": "rating",
      "average": 3.6,
      "distribution": { "1": 2, "2": 3, "3": 5, "4": 8, "5": 4 }
    }
  ]
}
```

### `GET /api/dashboard/companies/:companyId/surveys/:surveyId/comments`

Get open-text responses with sentiment analysis.

**Query params:** `?sentiment=negative&levelId=3`

**Response:**
```json
{
  "comments": [
    {
      "questionText": "What could we improve?",
      "text": "Better communication from leadership.",
      "sentiment": "negative",
      "organizationalLevel": "Engineering"
    }
  ]
}
```

### `GET /api/dashboard/companies/:companyId/surveys/:surveyId/actions`

Get all actions for a survey.

**Response:**
```json
{
  "actions": [
    {
      "id": 1,
      "concernArea": "Work-life balance",
      "description": "Introduce flexible working hours",
      "responsiblePerson": "HR Manager",
      "deadline": "2024-03-31",
      "status": "in_progress"
    }
  ]
}
```

### `POST /api/dashboard/actions`

Create a new action item.

**Request:**
```json
{
  "organizationalLevelId": 3,
  "surveyId": 1,
  "questionId": null,
  "concernArea": "Work-life balance",
  "description": "Introduce flexible working hours policy",
  "responsiblePerson": "HR Manager",
  "deadline": "2024-03-31"
}
```

### `PATCH /api/dashboard/actions/:actionId`

Update an action (e.g., change status, edit description).

**Request:**
```json
{ "status": "done" }
```

---

## Admin

### `GET /api/admin/companies`

List all companies with summary stats.

### `GET /api/admin/companies/:companyId`

Get full company details including org structure.

### `GET /api/admin/companies/:companyId/surveys`

List surveys for a company.

### `POST /api/admin/surveys/:surveyId/links`

Generate a new anonymous survey link.

**Request:**
```json
{
  "organizationalLevelId": null
}
```

**Response:**
```json
{
  "token": "uuid-token",
  "url": "https://voxtera.agiletransition.se/survey/uuid-token"
}
```

### `GET /api/admin/surveys/:surveyId/response-rates`

Get response rates broken down by organizational level.
