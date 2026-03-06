# Voxtera — Bootstrap Prompt

> Last updated: 2026-03-06
>
> **Purpose**: This file contains the complete prompt to recreate the Voxtera project from scratch. If you need to start over (new repo), use this as your instructions to GitHub Copilot or any AI coding assistant.

## How to Use

1. Create a new GitHub repository called `voxtera`
2. Open Copilot and paste the prompt below
3. Follow the manual steps listed at the end

---

## The Prompt

> Create a monorepo web project called "voxtera" with the following components. Build everything in one go.

### 1. Product Vision

**Voxtera** is an employee satisfaction survey tool with analysis and action tracking capabilities. SaaS product built on research and deep domain expertise in employee satisfaction surveys, sentiment analysis, and compliance.

The name "Voxtera" combines "Vox" (Latin for "voice") with "Terra" (Latin for "ground/foundation") — every voice matters, grounded in transparency.

**Three main parts:**
1. **Employee Survey Experience** — Beautiful, smooth, anonymous survey-taking via unique link
2. **Management Dashboard** — Results visualization at multiple org levels, auto-highlighted concerns, manager action tracking with deadlines
3. **HR Admin Panel** — Minimal: manage company structure, surveys, generate links, view response rates

### 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 (in Docker) |
| Sentiment Analysis | OpenAI API (simple positive/neutral/negative) |
| Hosting | Hetzner VPS (Ubuntu + Docker + Docker Compose) |
| Routing/SSL | Nginx Proxy Manager + Cloudflare |
| CI/CD | GitHub Actions → rsync to Hetzner |
| i18n | react-i18next (English now, multi-language ready) |
| Design | Clean Nordic aesthetic — soft blues, calming greens, warm amber accents, white space, Unsplash photo backgrounds |

### 3. Project Structure

Monorepo with three directories:
- `client/` — React 19 + TypeScript + Vite + Tailwind CSS frontend
  - `src/components/` — Reusable UI components
  - `src/pages/survey/` — Employee survey experience
  - `src/pages/dashboard/` — Management dashboard
  - `src/pages/admin/` — HR admin panel
  - `src/hooks/` — Custom React hooks
  - `src/services/` — API client
  - `src/i18n/` — Internationalization (English, ready for more)
  - `src/types/` — TypeScript types
- `server/` — Node.js + Express + TypeScript backend
  - `src/routes/` — Express route handlers
  - `src/models/` — Database queries
  - `src/services/` — Business logic
  - `src/db/migrations/` — SQL migration files
  - `src/db/seeds/` — Seed data
- `shared/` — Shared TypeScript types and constants

### 4. Database Schema

PostgreSQL tables:
- `companies` — id, name, slug, created_at, updated_at
- `organizational_levels` — id, company_id, name, type (team/department/division/hq), parent_id (self-referencing hierarchy), created_at
- `surveys` — id, company_id, title, description, status (draft/active/closed), starts_at, ends_at, created_at, updated_at
- `questions` — id, survey_id, text, type (rating/enps/open_text), order_position, required, config (jsonb), created_at
- `survey_links` — id, survey_id, token (unique UUID), organizational_level_id, is_active, created_at
- `responses` — id, survey_id, survey_link_id, organizational_level_id, session_id, started_at, completed_at, created_at
- `answers` — id, response_id, question_id, rating_value, text_value, sentiment (positive/neutral/negative), created_at
- `actions` — id, organizational_level_id, survey_id, question_id, concern_area, description, responsible_person, deadline, status (planned/in_progress/done), created_at, updated_at

### 5. Survey Types
- Rating scales (1–5 Likert with labels)
- eNPS (0–10 with promoter/passive/detractor)
- Open-ended text with simple sentiment analysis

### 6. POC Scope
- 1 real pilot company (20–30 employees)
- 2 mock companies with generated realistic data (~25 employees each)
- Anonymous survey links (no login for POC)
- English only (i18n architecture ready for Swedish, Danish, Norwegian, German, etc.)

### 7. Docker Setup
- `docker-compose.yml` for local development: PostgreSQL 16, Node.js server (port 3001), Vite dev server (port 5173)
- `docker-compose.prod.yml` for production: PostgreSQL, built server, nginx:alpine serving client static files
- All on shared Docker network

### 8. CI/CD
GitHub Actions workflow (`.github/workflows/deploy.yml`):
- Trigger on push to main
- Build client (npm ci, npm run build)
- Build server (npm ci, npm run build)
- Setup SSH key from GitHub Secrets
- rsync client dist + server dist to Hetzner server
- Same pattern as agiletransition.se repos

### 9. Seed Data
Three companies with organizational hierarchies:
- "Nordic Tech Solutions" (pilot — real data)
- "Scandinavian Health Group" (mock)
- "Baltic Digital Agency" (mock)
Each with HQ → Divisions → Departments → Teams and ~25 employees
Sample survey with 10–12 questions (mix of rating, eNPS, open text)
Mock response data for the 2 mock companies

---

## Manual Steps After Code Generation

### Hetzner Server Setup
1. SSH into the Hetzner server as `deploy`
2. Create directory: `mkdir -p ~/hosting/sites/voxtera/`
3. Add Voxtera containers to the master `docker-compose.yml` at `/home/deploy/hosting/docker-compose.yml`
4. Set up PostgreSQL data volume

### Nginx Proxy Manager
1. Open http://89.167.90.112:81
2. Add new Proxy Host for `voxtera.agiletransition.se`
3. Point to the Voxtera nginx container on port 80
4. Enable SSL via Let's Encrypt

### Cloudflare DNS
1. Go to dash.cloudflare.com
2. Add A record: `voxtera` → 89.167.90.112 (proxied)

### GitHub Secrets
Set in repository Settings → Secrets and variables → Actions:
- `SERVER_HOST` — 89.167.90.112
- `SERVER_USER` — deploy
- `SERVER_SSH_KEY` — Private SSH key for deploy user

### Environment Variables on Server
Create `/home/deploy/hosting/sites/voxtera/.env` with:
- POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
- DATABASE_URL
- NODE_ENV=production
- OPENAI_API_KEY (when sentiment analysis is added)

### Local Development
```bash
git clone https://github.com/Tschiffer46/voxtera.git
cd voxtera
docker-compose up
# Client: http://localhost:5173
# Server: http://localhost:3001
# Database: localhost:5432
```
