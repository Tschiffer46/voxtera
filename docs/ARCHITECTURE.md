# Voxtera — Architecture & Project Status

> Last updated: 2026-03-12

## What is Voxtera?

Voxtera is an employee satisfaction survey POC with analysis and action tracking.

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
│   │   └── index.ts         # Server entry (also serves client static files)
│   └── package.json
├── shared/                  # Shared types/constants
├── docs/                    # Project documentation
├── Dockerfile               # Production multi-stage build
├── docker-compose.yml       # Local development
├── .github/workflows/       # CI/CD
└── README.md
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript + Vite | SPA with fast dev experience |
| Styling | Tailwind CSS | Nordic-inspired clean design |
| Backend | Node.js + Express + TypeScript | REST API + static file serving |
| Database | PostgreSQL 16 | All data storage (in Docker) |
| Hosting | Hetzner VPS (Ubuntu + Docker) | Same server as agiletransition.se sites |
| Proxy | Nginx Proxy Manager | Traffic routing, SSL (Let's Encrypt) |
| DNS/CDN | Cloudflare | DNS resolution, caching, DDoS protection |
| CI/CD | GitHub Actions → GHCR → Docker pull | Auto-deploy on push to main |

## Database Schema

- **companies** — Multi-tenant company management
- **organizational_levels** — Self-referencing hierarchy (team -> department -> division -> HQ)
- **surveys** — Survey definitions with status and date range
- **questions** — Three types: rating (1-5), eNPS (0-10), open_text
- **survey_links** — Anonymous access tokens for survey distribution
- **responses** — Anonymous survey submissions
- **answers** — Individual question answers with optional sentiment tags
- **actions** — Manager improvement actions with deadlines and status tracking

## Infrastructure

### Traffic Flow
```
User → Cloudflare (DNS + CDN + HTTPS) → Hetzner Server (89.167.90.112) → Nginx Proxy Manager → voxtera container (:3001)
```

### Containers (Production)
- `voxtera` — Node.js Express serving both API and client static files (port 3001)
- `voxtera-db` — PostgreSQL 16

Both containers are defined in the master `/home/deploy/hosting/docker-compose.yml` on the Hetzner server and run on the shared `web` Docker network.

### Deployment Pattern (Type B)
Follows the same pattern as stegvis-app:
1. GitHub Actions builds a Docker image (multi-stage: client + server)
2. Pushes to `ghcr.io/tschiffer46/voxtera:latest`
3. SSHs to Hetzner, pulls the image, restarts the container
4. Runs database migrations automatically

### Domain
- `voxtera.agiletransition.se` (POC)

## Key Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Production multi-stage build (client + server combined) |
| `docker-compose.yml` | Local development environment |
| `.github/workflows/deploy.yml` | CI/CD pipeline (GHCR + Docker pull) |
| `server/src/db/migrations/` | Database schema evolution |
| `server/src/db/seeds/` | Mock/test data |
| `docs/DATABASE-SCHEMA.md` | Database design documentation |
| `docs/API-DESIGN.md` | REST API specification |
