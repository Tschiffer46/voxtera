# Voxtera — Deployment Guide

> Last updated: 2026-03-06

## Overview

Voxtera is deployed to a Hetzner VPS at **89.167.90.112**, the same server that hosts other agiletransition.se projects. Deployment is fully automated via GitHub Actions: every push to `main` triggers a build-and-deploy pipeline that rsync's the built artefacts to the server and restarts the Docker containers.

---

## Architecture

```
Developer pushes to main
        ↓
GitHub Actions (build + rsync)
        ↓
Hetzner VPS (89.167.90.112)
  └── Docker Compose (master)
        ├── Nginx Proxy Manager  ← handles SSL + routing
        ├── voxtera-client       ← nginx:alpine, built React SPA
        ├── voxtera-server       ← Node.js Express API (port 3001)
        └── voxtera-db           ← PostgreSQL 16
        ↑
Cloudflare (DNS + CDN)  →  voxtera.agiletransition.se
```

---

## GitHub Actions CI/CD Pipeline

### Workflow file
`.github/workflows/deploy.yml`

### Trigger
Runs automatically on every push to the `main` branch.

### Steps
1. **Checkout** — Clone the repository
2. **Build client** — `cd client && npm ci && npm run build` (outputs to `client/dist/`)
3. **Build server** — `cd server && npm ci && npm run build` (outputs to `server/dist/`)
4. **Setup SSH** — Load `SERVER_SSH_KEY` from GitHub Secrets
5. **rsync client** — Copy `client/dist/` to `~/hosting/sites/voxtera/client/dist/` on the server
6. **rsync server** — Copy `server/dist/` and `server/package.json` to `~/hosting/sites/voxtera/server/` on the server
7. **Restart containers** — SSH in and run `docker compose restart voxtera-server voxtera-client`

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `SERVER_HOST` | `89.167.90.112` |
| `SERVER_USER` | `deploy` |
| `SERVER_SSH_KEY` | Private SSH key for the `deploy` user on Hetzner |

---

## First-Time Server Setup

These steps only need to be done once when adding Voxtera to the server.

### 1. SSH into the Server

```bash
ssh deploy@89.167.90.112
```

### 2. Create Voxtera Directory

```bash
mkdir -p ~/hosting/sites/voxtera/client/dist
mkdir -p ~/hosting/sites/voxtera/server
```

### 3. Create Environment File

```bash
nano ~/hosting/sites/voxtera/.env
```

Paste and fill in:

```env
# PostgreSQL
POSTGRES_USER=voxtera
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=voxtera_production

# App
DATABASE_URL=postgresql://voxtera:<strong-password>@voxtera-db:5432/voxtera_production
NODE_ENV=production
PORT=3001

# OpenAI (add when sentiment analysis is enabled)
# OPENAI_API_KEY=sk-...
```

### 4. Add Voxtera to the Master Docker Compose

Edit `/home/deploy/hosting/docker-compose.yml` and add the Voxtera services:

```yaml
  voxtera-db:
    image: postgres:16-alpine
    container_name: voxtera-db
    env_file: ./sites/voxtera/.env
    volumes:
      - voxtera_postgres_data:/var/lib/postgresql/data
    networks:
      - proxy

  voxtera-server:
    build: ./sites/voxtera/server
    container_name: voxtera-server
    env_file: ./sites/voxtera/.env
    depends_on:
      - voxtera-db
    networks:
      - proxy

  voxtera-client:
    image: nginx:alpine
    container_name: voxtera-client
    volumes:
      - ./sites/voxtera/client/dist:/usr/share/nginx/html:ro
    networks:
      - proxy

volumes:
  voxtera_postgres_data:
```

### 5. Start Containers

```bash
cd ~/hosting
docker compose up -d voxtera-db voxtera-server voxtera-client
```

### 6. Run Database Migrations

```bash
docker exec voxtera-server npm run migrate
```

### 7. (Optional) Seed Demo Data

```bash
docker exec voxtera-server npm run seed
```

---

## Nginx Proxy Manager Setup

1. Open http://89.167.90.112:81
2. Log in to Nginx Proxy Manager
3. Click **Proxy Hosts → Add Proxy Host**
4. Fill in:
   - **Domain Name:** `voxtera.agiletransition.se`
   - **Scheme:** `http`
   - **Forward Hostname / IP:** `voxtera-client`
   - **Forward Port:** `80`
5. On the **SSL** tab:
   - Select **Request a new SSL Certificate**
   - Enable **Force SSL**
   - Enable **HTTP/2 Support**
   - Agree to Let's Encrypt Terms of Service
6. Save

For API requests, add a second proxy host (or configure a location block) pointing `voxtera-server` on port `3001`.

---

## Cloudflare DNS Setup

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select the `agiletransition.se` zone
3. Click **DNS → Add record**:
   - **Type:** A
   - **Name:** `voxtera`
   - **IPv4 address:** `89.167.90.112`
   - **Proxy status:** Proxied (orange cloud)
4. Save

DNS propagation usually takes a few minutes.

---

## How a Normal Deploy Works

1. Developer merges a PR (or pushes directly) to `main`
2. GitHub Actions workflow starts automatically (~2-3 minutes total)
3. Client and server are built in parallel
4. Built files are rsync'd to the Hetzner server
5. `voxtera-server` and `voxtera-client` containers are restarted
6. Site is live at https://voxtera.agiletransition.se

No manual steps needed for normal code changes.

---

## Manual Deploy (if CI Fails)

If the GitHub Actions workflow fails, you can deploy manually:

```bash
# On your local machine

# Build client
cd client && npm ci && npm run build

# Build server
cd ../server && npm ci && npm run build

# rsync client to server
rsync -avz --delete client/dist/ deploy@89.167.90.112:~/hosting/sites/voxtera/client/dist/

# rsync server to server
rsync -avz --delete server/dist/ server/package.json deploy@89.167.90.112:~/hosting/sites/voxtera/server/

# SSH in and restart containers
ssh deploy@89.167.90.112 "cd ~/hosting && docker compose restart voxtera-server voxtera-client"
```

---

## Rollback a Deployment

If a deployment breaks the site, the fastest recovery is to revert on GitHub and let the pipeline redeploy:

```bash
# On your local machine — revert the last commit
git revert HEAD
git push origin main
```

GitHub Actions will automatically redeploy the reverted version.

For a manual rollback to a specific previous build, SSH into the server and restore from a previous rsync snapshot (if backups are configured), or re-run the GitHub Actions workflow on an older commit via the GitHub UI (Actions tab → select the run → Re-run jobs).

---

## Local Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 20+

### Start Everything with Docker

```bash
git clone https://github.com/Tschiffer46/voxtera.git
cd voxtera
cp .env.example .env
docker-compose up
```

Services:
- **React client:** http://localhost:5173
- **Express API:** http://localhost:3001
- **PostgreSQL:** localhost:5432

### Without Docker (database still needs Docker)

```bash
# Start only the database
docker-compose up db

# Terminal 1 — server
cd server && npm install && npm run dev

# Terminal 2 — client
cd client && npm install && npm run dev
```

---

## Production vs Development Differences

| Aspect | Development | Production |
|--------|-------------|------------|
| Client | Vite dev server with HMR | nginx:alpine serving static build |
| Server | `ts-node` / `tsx` (no build step) | Compiled `dist/` via `tsc` |
| Database | Local Docker, ephemeral or volume | Persistent Docker volume, nightly backups |
| SSL | None (HTTP only) | Let's Encrypt via Nginx Proxy Manager |
| ENV | `.env` file in repo root | `.env` on server at `~/hosting/sites/voxtera/.env` |
| Logs | Terminal output | `docker logs voxtera-server` |
| API base URL | `http://localhost:3001` | `https://voxtera.agiletransition.se/api` |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_USER` | Yes | PostgreSQL username |
| `POSTGRES_PASSWORD` | Yes | PostgreSQL password |
| `POSTGRES_DB` | Yes | PostgreSQL database name |
| `DATABASE_URL` | Yes | Full PostgreSQL connection string |
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | API port (default: 3001) |
| `OPENAI_API_KEY` | No | Required when sentiment analysis is enabled |
