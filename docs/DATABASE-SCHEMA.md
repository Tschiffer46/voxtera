# Voxtera — Database Schema

## Overview

PostgreSQL 16 database with the following tables to support the employee survey platform.

## Entity Relationships

```
companies
  └── organizational_levels (self-referencing hierarchy: HQ → Division → Department → Team)
  └── surveys
        └── questions
        └── survey_links
              └── responses
                    └── answers

organizational_levels
  └── survey_links
  └── responses
  └── actions

surveys
  └── actions

questions
  └── answers
  └── actions (optional link)
```

## Tables

### `companies`

Represents a customer organization using Voxtera.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing ID |
| name | VARCHAR(255) NOT NULL | Company display name |
| slug | VARCHAR(100) UNIQUE NOT NULL | URL-safe identifier |
| created_at | TIMESTAMPTZ DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ DEFAULT NOW() | Last update timestamp |

---

### `organizational_levels`

Stores the company hierarchy: HQ → Division → Department → Team. Self-referencing for nested structure.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing ID |
| company_id | INTEGER REFERENCES companies(id) | Owning company |
| name | VARCHAR(255) NOT NULL | Level name (e.g. "Engineering") |
| type | ENUM(team, department, division, hq) | Level in hierarchy |
| parent_id | INTEGER REFERENCES organizational_levels(id) | Parent level (NULL for HQ) |
| created_at | TIMESTAMPTZ DEFAULT NOW() | Creation timestamp |

---

### `surveys`

A survey configured for a company, with a lifecycle status.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing ID |
| company_id | INTEGER REFERENCES companies(id) | Owning company |
| title | VARCHAR(255) NOT NULL | Survey title |
| description | TEXT | Optional description |
| status | ENUM(draft, active, closed) DEFAULT 'draft' | Survey lifecycle status |
| starts_at | TIMESTAMPTZ | Survey open date/time |
| ends_at | TIMESTAMPTZ | Survey close date/time |
| created_at | TIMESTAMPTZ DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ DEFAULT NOW() | Last update timestamp |

---

### `questions`

Individual questions within a survey.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing ID |
| survey_id | INTEGER REFERENCES surveys(id) | Parent survey |
| text | TEXT NOT NULL | Question text |
| type | ENUM(rating, enps, open_text) | Question type |
| order_position | INTEGER NOT NULL | Display order |
| required | BOOLEAN DEFAULT TRUE | Whether answer is required |
| config | JSONB | Type-specific config (scale labels, min/max) |
| created_at | TIMESTAMPTZ DEFAULT NOW() | Creation timestamp |

**Config examples:**
- Rating: `{ "min": 1, "max": 5, "min_label": "Strongly Disagree", "max_label": "Strongly Agree" }`
- eNPS: `{ "min": 0, "max": 10, "min_label": "Not at all likely", "max_label": "Extremely likely" }`
- Open text: `{ "placeholder": "Share your thoughts..." }`

---

### `survey_links`

Unique anonymous access tokens for distributing surveys.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing ID |
| survey_id | INTEGER REFERENCES surveys(id) | Target survey |
| token | UUID UNIQUE NOT NULL | Unique access token |
| organizational_level_id | INTEGER REFERENCES organizational_levels(id) | Optional: scoped to a team/dept |
| is_active | BOOLEAN DEFAULT TRUE | Whether the link is usable |
| created_at | TIMESTAMPTZ DEFAULT NOW() | Creation timestamp |

---

### `responses`

A single anonymous survey session (one employee completing the survey).

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing ID |
| survey_id | INTEGER REFERENCES surveys(id) | Survey being answered |
| survey_link_id | INTEGER REFERENCES survey_links(id) | Link used to access |
| organizational_level_id | INTEGER REFERENCES organizational_levels(id) | Team/dept chosen by respondent |
| session_id | VARCHAR(255) | Anonymous session identifier |
| started_at | TIMESTAMPTZ DEFAULT NOW() | When the session started |
| completed_at | TIMESTAMPTZ | When the survey was completed (NULL if abandoned) |
| created_at | TIMESTAMPTZ DEFAULT NOW() | Creation timestamp |

---

### `answers`

Individual question answers within a response.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing ID |
| response_id | INTEGER REFERENCES responses(id) | Parent response |
| question_id | INTEGER REFERENCES questions(id) | Question being answered |
| rating_value | INTEGER | Numeric value (for rating/eNPS questions) |
| text_value | TEXT | Text answer (for open_text questions) |
| sentiment | ENUM(positive, neutral, negative) | Sentiment analysis result (nullable) |
| created_at | TIMESTAMPTZ DEFAULT NOW() | Creation timestamp |

---

### `actions`

Manager-created action items tied to survey results and concerns.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing ID |
| organizational_level_id | INTEGER REFERENCES organizational_levels(id) | Team/dept this action targets |
| survey_id | INTEGER REFERENCES surveys(id) | Related survey |
| question_id | INTEGER REFERENCES questions(id) | Optional: specific question |
| concern_area | TEXT NOT NULL | Description of the concern area |
| description | TEXT NOT NULL | Action description |
| responsible_person | VARCHAR(255) | Name/role of accountable person |
| deadline | DATE | Target completion date |
| status | ENUM(planned, in_progress, done) DEFAULT 'planned' | Action status |
| created_at | TIMESTAMPTZ DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ DEFAULT NOW() | Last update timestamp |

## Indexes

```sql
-- Fast survey link lookup by token
CREATE INDEX idx_survey_links_token ON survey_links(token);

-- Response lookups by survey
CREATE INDEX idx_responses_survey_id ON responses(survey_id);

-- Answer lookups by response
CREATE INDEX idx_answers_response_id ON answers(response_id);

-- Org level hierarchy traversal
CREATE INDEX idx_org_levels_parent_id ON organizational_levels(parent_id);
CREATE INDEX idx_org_levels_company_id ON organizational_levels(company_id);
```
