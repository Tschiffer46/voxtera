# Voxtera — Architecture & Project Status

> Last updated: 2026-03-06

## What is Voxtera?

Voxtera ("voice" + "ground") is an employee satisfaction survey tool with analysis and action tracking. It's a SaaS product combining research expertise in employee satisfaction, sentiment analysis, and survey design with practical experience in internal/external surveys and compliance work.

**Three main parts:**
1. Employee Survey Experience — smooth, anonymous survey-taking
2. Management Dashboard — results, concern highlighting, action tracking
3. HR Admin Panel — survey and company management

## Repository Structure

```
voxtera/
├── client/                  # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/
│   │   │   ├── survey/      # Employee survey experience
│   │   │   ├── dashboard/   # Management dashboard
│   │   │   └── admin/       # HR admin panel
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client
│   │   ├── i18n/            # Internationalization
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utilities
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── server/                  # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── models/          # Database queries
│   │   ├── middleware/
│   │   ├── services/        # Business logic
│   │   ├── db/
│   │   │   ├── migrations/  # SQL migrations
│   │   │   ├── seeds/       # Seed data
│   │   │   └── index.ts     # DB connection
│   │   └── index.ts         # Server entry
│   └── package.json
├── shared/                  # Shared types/constants
├── docs/                    # Project documentation
├── docker-compose.yml       # Local development
├── docker-compose.prod.yml  # Production
├── .github/workflows/       # CI/CD
├── BOOTSTRAP.md             # Recreation prompt
└── README.md
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript + Vite | SPA with fast dev experience |
| Styling | Tailwind CSS | Nordic-inspired clean design |
| Backend | Node.js + Express + TypeScript | REST API |
| Database | PostgreSQL 16 | All data storage (in Docker) |
| Sentiment | OpenAI API | Simple positive/neutral/negative tagging |
| i18n | react-i18next | English now, multi-language ready |
| Hosting | Hetzner VPS (Ubuntu + Docker) | Same server as agiletransition.se sites |
| Proxy | Nginx Proxy Manager | Traffic routing, SSL (Let's Encrypt) |
| DNS/CDN | Cloudflare | DNS resolution, caching, DDoS protection |
| CI/CD | GitHub Actions + rsync | Auto-deploy on push to main |

## Database Schema

- **companies** — Multi-tenant company management
- **organizational_levels** — Self-referencing hierarchy (team → department → division → HQ)
- **surveys** — Survey definitions with status and date range
- **questions** — Three types: rating (1-5), eNPS (0-10), open_text
- **survey_links** — Anonymous access tokens for survey distribution
- **responses** — Anonymous survey submissions
- **answers** — Individual question answers with optional sentiment tags
- **actions** — Manager improvement actions with deadlines and status tracking

## Infrastructure

### Traffic Flow
```
User → Cloudflare (DNS + CDN + HTTPS) → Hetzner Server (89.167.90.112) → Nginx Proxy Manager → Voxtera containers
```

### Containers (Production)
- `voxtera-client` — nginx:alpine serving built React static files
- `voxtera-server` — Node.js Express API
- `voxtera-db` — PostgreSQL 16

### Domain
- `voxtera.agiletransition.se` (POC)

## Current Status (as of 2026-03-06)

### ✅ Phase 1 — Foundation (Done)
- Monorepo structure (client/server/shared)
- Docker Compose for dev and production
- Database schema and migrations
- Seed data (3 companies with org hierarchies)
- Express API with health check and placeholder routes
- React client with routing, i18n, Tailwind, Nordic color palette
- GitHub Actions deployment workflow
- Project documentation

### 📋 Phase 2 — Employee Survey Experience (Next)
- Anonymous link system (/survey/{token})
- One-question-at-a-time survey UI
- Rating scale, eNPS, and open text question types
- Progress indicator and completion screen
- Mobile-first responsive design
- Nordic visual design with photo backgrounds

### 🔮 Future Phases
- Phase 3: Management Dashboard (results, concerns, actions)
- Phase 4: Admin Panel & Polish
- Phase 5: Investor Demo Ready

### Post-POC Roadmap
- Employee login & personal survey history
- Advanced AI sentiment analysis & theme extraction
- Automated action suggestions based on research
- Industry benchmarking
- Multi-language (Swedish, Danish, Norwegian, German...)
- HRIS, Slack, Teams integrations
- Recurring pulse surveys with trend analysis
- Manager coaching recommendations

## Key Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Local development environment |
| `docker-compose.prod.yml` | Production deployment |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `server/src/db/migrations/` | Database schema evolution |
| `server/src/db/seeds/` | Mock/test data |
| `docs/PROJECT-PLAN.md` | Full project plan with all phases |
| `docs/DATABASE-SCHEMA.md` | Database design documentation |
| `docs/API-DESIGN.md` | REST API specification |
| `BOOTSTRAP.md` | Complete recreation prompt |
