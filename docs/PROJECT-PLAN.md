# Voxtera — Project Plan

## Product Vision

An employee satisfaction survey tool with analysis and action capabilities. SaaS-only, MVP-first approach.

**Working name:** Voxtera — "Every voice matters, grounded in transparency"

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL (in Docker) |
| Sentiment Analysis | OpenAI API (simple pos/neutral/neg) |
| Hosting | Hetzner VPS (Docker + Docker Compose) |
| Routing/SSL | Nginx Proxy Manager + Cloudflare |
| CI/CD | GitHub Actions → rsync |
| i18n | react-i18next (English now, multi-language ready) |
| Design | Nordic clean, warm colors, Unsplash imagery |

## POC Scope

- 1 real pilot company (20–30 employees)
- 2 mock companies with generated realistic data (~25 employees each)
- Anonymous survey links (no login for POC)
- English only (i18n-ready for future languages)

## Survey Types Supported

- Rating scales (1–5 Likert)
- eNPS (0–10)
- Open-ended text with simple sentiment analysis (positive/neutral/negative)

## Phase 1 — Foundation (Week 1–2)

- Project setup, monorepo structure
- Docker Compose config (React app + Node API + PostgreSQL)
- Database schema
- Seed data: 3 companies, ~25 employees each
- Basic API endpoints
- GitHub Actions deploy pipeline
- Domain: voxtera.agiletransition.se

## Phase 2 — Employee Survey Experience (Week 3–4)

- Anonymous link system (/survey/{unique-token})
- Employee selects team/department (anonymous)
- Survey UI — one question at a time, smooth transitions
- Rating scale, eNPS, open text question types
- Progress indicator
- Thank-you / completion screen
- Mobile-first responsive design
- Nordic visual design

## Phase 3 — Management Dashboard (Week 5–7)

- Dashboard landing with key metrics
- Drill-down: Company → Division → Department → Team
- Charts: average scores, eNPS breakdown, trends
- Areas of Concern — auto-highlighting scores below threshold
- Open-text comments with sentiment tags
- Action system: manager writes actions with deadlines, tracks status
- Response rate tracking

## Phase 4 — Admin Panel & Polish (Week 8–9)

- Minimal admin: view/edit company structure, view surveys, generate links, response rates
- Seed realistic mock data for demo
- Sentiment analysis integration (OpenAI API)
- UI polish, loading states, error handling

## Phase 5 — Investor Demo Ready (Week 10)

- End-to-end testing
- Performance check
- Demo scenarios prepared
- Landing page

## Post-POC Roadmap

- Employee login & personal survey history
- Advanced AI sentiment analysis & theme extraction
- Automated action suggestions
- Benchmarking across industries
- Multi-language (Swedish, Danish, Norwegian, German...)
- HRIS, Slack, Teams integrations
- Recurring pulse surveys with trends
- Manager coaching recommendations
