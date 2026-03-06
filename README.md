# Voxtera

> Every voice matters, grounded in transparency

Voxtera is an employee satisfaction survey tool with analysis and action tracking. A SaaS product built for teams that want to act on employee feedback.

## Features

- 📋 **Employee survey experience** — beautiful, smooth, anonymous survey-taking
- 📊 **Management dashboard** — results visualization, concern highlighting, action tracking
- ⚙️ **HR admin panel** — survey and company management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL 16 (Docker) |
| Sentiment Analysis | OpenAI API |
| Hosting | Hetzner VPS (Docker + Docker Compose) |
| Routing/SSL | Nginx Proxy Manager + Cloudflare |
| CI/CD | GitHub Actions → rsync |
| i18n | react-i18next (English now, multi-language ready) |

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
docker-compose up
```

This starts:
- **PostgreSQL** on port 5432
- **API server** on http://localhost:3001
- **React client** on http://localhost:5173

### Local Development (without Docker)

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Start the database (still needs Docker)
docker-compose up db

# In one terminal — start server
cd server && npm run dev

# In another terminal — start client
cd client && npm run dev
```

## Project Structure

```
voxtera/
├── client/          # React frontend (Vite + TypeScript + Tailwind)
├── server/          # Node.js backend (Express + TypeScript + pg)
├── shared/          # Shared types and constants
├── docs/            # Project documentation
├── docker-compose.yml       # Local development
├── docker-compose.prod.yml  # Production
└── .env.example     # Environment variable template
```

## Documentation

- [Project Plan](docs/PROJECT-PLAN.md) — Full project roadmap and phases
- [Database Schema](docs/DATABASE-SCHEMA.md) — Database design
- [API Design](docs/API-DESIGN.md) — REST API endpoints

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. See the file for descriptions.

## Domain

Production: [voxtera.agiletransition.se](https://voxtera.agiletransition.se)