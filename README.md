# Voxtera

> Every voice matters, grounded in transparency

Voxtera is an employee satisfaction survey tool with analysis and action tracking. A SaaS POC built for teams that want to act on employee feedback.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 (Docker) |
| Hosting | Hetzner VPS (Docker + Docker Compose) |
| Routing/SSL | Nginx Proxy Manager + Cloudflare |
| CI/CD | GitHub Actions → GHCR → Docker pull |

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- Node.js 20+ (for local development without Docker)

### Quick Start with Docker

```bash
# Clone the repo
git clone https://github.com/Tschiffer46/voxtera.git
cd voxtera

# Copy environment config
cp .env.example .env

# Start everything
docker compose up
```

This starts:
- **PostgreSQL** on port 5432
- **API server** on http://localhost:3001
- **React client** on http://localhost:5173

### Local Development (without Docker)

```bash
# Start the database (still needs Docker)
docker compose up db

# In one terminal — start server
cd server && npm install && npm run dev

# In another terminal — start client
cd client && npm install && npm run dev
```

## Project Structure

```
voxtera/
├── client/          # React frontend (Vite + TypeScript + Tailwind)
├── server/          # Node.js backend (Express + TypeScript + pg)
├── shared/          # Shared types and constants
├── docs/            # Project documentation
├── Dockerfile       # Production multi-stage build
├── docker-compose.yml  # Local development
└── .env.example     # Environment variable template
```

## Deployment

Deployment follows the **Type B pattern** (Docker image via GHCR) used across all ATM AB full-stack apps.

On push to `main`, GitHub Actions:
1. Builds a Docker image (client + server combined)
2. Pushes to `ghcr.io/tschiffer46/voxtera:latest`
3. SSHs to Hetzner and pulls the new image
4. Restarts the container and runs database migrations

The Hetzner server runs the container via the master `docker-compose.yml` at `/home/deploy/hosting/`.

### Required GitHub Secrets

| Secret | Value |
|--------|-------|
| `SERVER_HOST` | `89.167.90.112` |
| `SERVER_USER` | `deploy` |
| `SERVER_SSH_KEY` | Private SSH key for the deploy user |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — Architecture and project status
- [Database Schema](docs/DATABASE-SCHEMA.md) — Database design
- [API Design](docs/API-DESIGN.md) — REST API endpoints

## Domain

Production: [voxtera.agiletransition.se](https://voxtera.agiletransition.se)
