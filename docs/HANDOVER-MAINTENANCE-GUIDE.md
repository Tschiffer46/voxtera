# Voxtera — Handover & Maintenance Guide

> Last updated: 2026-03-06
>
> **Audience:** This guide is written for non-technical team members taking over or maintaining the Voxtera project. Every step is explained in plain language with exact commands you can copy and paste.

---

## 1. Introduction & Solution Overview

**Voxtera** is an employee satisfaction survey web application. It allows companies to:

- Distribute anonymous surveys to employees via unique links
- Collect and analyze responses with sentiment tagging
- View results in a management dashboard broken down by team/department/division
- Track improvement actions with deadlines and status

It is a **SaaS product** — meaning it runs on the internet and is accessed through a web browser. There is no app to install.

**Domain:** https://voxtera.agiletransition.se

**Important:** Unlike a simple website, Voxtera has a **database** that stores real employee data. This means:
- Regular database backups are essential
- Security must be taken seriously
- Upgrades require more care than a static site

---

## 2. Architecture

### How Traffic Flows

```
Employee / Manager browser
        ↓ (HTTPS)
Cloudflare (DNS + security + caching)
        ↓
Hetzner VPS — 89.167.90.112
        ↓
Nginx Proxy Manager (SSL termination, routing)
        ├── voxtera-client  (React web app)
        └── voxtera-server  (API backend)
                ↓
        voxtera-db  (PostgreSQL database)
```

### Key Facts

- **Everything runs in Docker containers** on a single server in Germany (Hetzner)
- **Three containers** work together: the web app (client), the API (server), and the database (db)
- **Cloudflare** sits in front and provides security and HTTPS
- **Nginx Proxy Manager** routes requests to the right container
- **GitHub** stores all the code; pushes to `main` automatically deploy updates

---

## 3. Tech Stack

| Technology | What It Is | Used For |
|------------|-----------|---------|
| React 19 | JavaScript framework | The web interface employees and managers see |
| TypeScript | Programming language | Frontend and backend code |
| Vite | Build tool | Bundles the frontend for production |
| Tailwind CSS | CSS framework | Styling and visual design |
| Node.js + Express | JavaScript runtime + web framework | The API backend |
| PostgreSQL 16 | Database | Storing all survey data, responses, companies |
| Docker / Docker Compose | Container technology | Runs all parts of the app in isolation |
| nginx:alpine | Web server | Serves the built React app in production |
| Nginx Proxy Manager | Reverse proxy | Routes traffic and manages SSL certificates |
| Cloudflare | DNS + CDN | Domain resolution, HTTPS, DDoS protection |
| GitHub Actions | CI/CD automation | Builds and deploys code automatically |
| OpenAI API | AI service | Sentiment analysis on open text responses |
| react-i18next | Internationalization | Multi-language support (English now) |

---

## 4. Deployment Method

### How Code Gets to Production

1. A developer pushes code changes to the `main` branch on GitHub
2. GitHub Actions automatically starts a **workflow** (a series of automated steps)
3. The workflow builds the frontend and backend
4. The built files are transferred to the Hetzner server via rsync (secure file sync)
5. The Docker containers are restarted to pick up the new code
6. The site is live — usually within 2–3 minutes of a push

**You can watch this happen** at:
https://github.com/Tschiffer46/voxtera/actions

### Required GitHub Secrets

These secrets are stored in GitHub and used by the deployment workflow. They must never be shared or committed to the repository.

| Secret Name | What It Is |
|-------------|-----------|
| `SERVER_HOST` | The server IP address: `89.167.90.112` |
| `SERVER_USER` | The server username: `deploy` |
| `SERVER_SSH_KEY` | The private SSH key that lets GitHub log in to the server |

To view or update secrets: GitHub → Settings → Secrets and variables → Actions

---

## 5. Server Access & Users

### SSH Access

To log in to the server directly:

```bash
ssh deploy@89.167.90.112
```

You need the **SSH private key** for the `deploy` user. This key should be stored securely (e.g., in a password manager).

### User Accounts

| User | Purpose |
|------|---------|
| `deploy` | The main deployment user. Has access to Docker and the hosting directory. |
| `root` | Full system access. Use with caution. Prefer `deploy` for day-to-day tasks. |

The `deploy` user is a member of the `docker` group, allowing it to run Docker commands without `sudo`.

---

## 6. Security

### Important: Voxtera Stores Real Data

Unlike a simple marketing website, Voxtera stores employee survey responses. This means:

- **Database backups are mandatory** (see Section 8)
- **Credentials must never be committed** to the GitHub repository
- **Access to the server should be limited** to trusted team members
- **The OpenAI API key** (when in use) must be kept secret

### SSH Keys

- GitHub Actions uses a dedicated SSH key to deploy
- Team members needing server access need their own SSH key
- Keys are stored as GitHub Secrets and in `~/.ssh/authorized_keys` on the server
- If a team member leaves, remove their key from `~/.ssh/authorized_keys`

### Cloudflare

- Cloudflare acts as a security layer between the internet and the server
- It blocks many common attacks automatically
- The real server IP (89.167.90.112) is hidden from most visitors
- SSL certificates are provided by Let's Encrypt (auto-renewed)

### Database Credentials

- Database credentials are stored in `/home/deploy/hosting/sites/voxtera/.env` on the server
- They are **never** stored in the GitHub repository
- If credentials need to be changed, update the `.env` file and restart the containers

### Environment Variables

The `.env` file on the server contains all sensitive configuration:

```
/home/deploy/hosting/sites/voxtera/.env
```

To view the current contents:

```bash
ssh deploy@89.167.90.112
cat ~/hosting/sites/voxtera/.env
```

---

## 7. Hosting & Infrastructure

### Hetzner VPS

- **Provider:** Hetzner Cloud (Germany)
- **IP:** 89.167.90.112
- **OS:** Ubuntu (Linux)
- **Login:** `ssh deploy@89.167.90.112`
- **Hosting root:** `/home/deploy/hosting/`
- **Voxtera files:** `/home/deploy/hosting/sites/voxtera/`

Voxtera shares this server with other agiletransition.se projects.

### Nginx Proxy Manager

- **URL:** http://89.167.90.112:81
- Routes incoming HTTPS requests to the right Docker container
- Manages SSL certificates automatically
- To add or change routing rules, log in to Nginx Proxy Manager

### Cloudflare

- **URL:** https://dash.cloudflare.com
- DNS record: `voxtera.agiletransition.se` → `89.167.90.112` (Proxied)
- Provides free DDoS protection and SSL for visitors

### Docker

All Voxtera components run as Docker containers defined in the master Docker Compose file:

```
/home/deploy/hosting/docker-compose.yml
```

| Container | Purpose | Internal Port |
|-----------|---------|--------------|
| `voxtera-client` | Serves the React web app | 80 |
| `voxtera-server` | Node.js API backend | 3001 |
| `voxtera-db` | PostgreSQL 16 database | 5432 |

---

## 8. Database Management

**PostgreSQL is the heart of Voxtera.** It stores all companies, surveys, questions, responses, and actions. Treat it carefully.

### Connect to the Database

```bash
# SSH into the server first
ssh deploy@89.167.90.112

# Connect to PostgreSQL
docker exec -it voxtera-db psql -U voxtera -d voxtera_production
```

Common SQL commands once connected:
```sql
-- List all tables
\dt

-- See all companies
SELECT * FROM companies;

-- See recent survey responses
SELECT * FROM responses ORDER BY created_at DESC LIMIT 10;

-- Exit
\q
```

### Run Database Migrations

When the codebase is updated with new database changes (migrations), run:

```bash
ssh deploy@89.167.90.112
docker exec voxtera-server npm run migrate
```

Migrations are located in `server/src/db/migrations/` and are run in order.

### Backup the Database

**Run this at least once per week. Before any major update, always run a backup first.**

```bash
# SSH into the server
ssh deploy@89.167.90.112

# Create a backup (replace the date in the filename)
docker exec voxtera-db pg_dump -U voxtera voxtera_production > ~/backups/voxtera_$(date +%Y-%m-%d).sql

# Create the backups directory if it doesn't exist
mkdir -p ~/backups
```

To automate weekly backups, add this to the `deploy` user's crontab (`crontab -e`):

```
0 2 * * 0 docker exec voxtera-db pg_dump -U voxtera voxtera_production > /home/deploy/backups/voxtera_$(date +\%Y-\%m-\%d).sql
```

### Restore from Backup

```bash
# SSH into the server
ssh deploy@89.167.90.112

# Restore (replace the filename with your backup file)
cat ~/backups/voxtera_2026-03-06.sql | docker exec -i voxtera-db psql -U voxtera -d voxtera_production
```

### Copy Backups Off the Server

Store backups somewhere other than the server itself:

```bash
# On your local machine
scp deploy@89.167.90.112:~/backups/voxtera_2026-03-06.sql ./
```

---

## 9. Software Upgrades & Maintenance

### Recommended Monthly Maintenance Checklist

Run these steps once a month:

```bash
# 1. SSH into the server
ssh deploy@89.167.90.112

# 2. Backup the database FIRST
mkdir -p ~/backups
docker exec voxtera-db pg_dump -U voxtera voxtera_production > ~/backups/voxtera_$(date +%Y-%m-%d)_premaintenance.sql

# 3. Update Ubuntu packages
sudo apt update && sudo apt upgrade -y

# 4. Check Docker disk usage
docker system df

# 5. Remove unused Docker images and containers
docker system prune -f

# 6. Check that all Voxtera containers are running
cd ~/hosting && docker compose ps

# 7. Check server disk space
df -h
```

### Update npm Dependencies

When you want to update Node.js packages (do this on a branch, not directly on main):

```bash
# On your development machine, in the repository
cd server && npm update
cd ../client && npm update

# Check for outdated packages
npm outdated
```

Test thoroughly before pushing to main.

### Update PostgreSQL

PostgreSQL major versions (e.g., 16 → 17) require a migration procedure. Minor versions update automatically with `apt upgrade`. Only do a major version upgrade if you have a specific reason and follow the official PostgreSQL upgrade guide.

### Update Node.js

Node.js version is specified in the Docker images. To change it, update the `FROM node:XX` line in the relevant `Dockerfile` and test the build locally first.

---

## 10. Troubleshooting Quick Reference

### Site Shows 502 Bad Gateway

The `voxtera-server` container is probably down.

```bash
ssh deploy@89.167.90.112
cd ~/hosting
docker compose ps                          # Check status of all containers
docker compose logs voxtera-server --tail=50  # Check server logs for errors
docker compose restart voxtera-server     # Restart the server container
```

### Site Not Loading at All (No Response)

```bash
# Check if containers are running
ssh deploy@89.167.90.112
cd ~/hosting && docker compose ps

# If containers are stopped, start them
docker compose up -d

# Check Nginx Proxy Manager is running
docker compose ps nginx-proxy-manager
```

Also check Cloudflare status at https://www.cloudflarestatus.com

### Deploy Failed in GitHub Actions

1. Go to https://github.com/Tschiffer46/voxtera/actions
2. Click on the failed workflow run
3. Click on the failed job to see error details

Common causes:
- **SSH connection failed** — Check that `SERVER_SSH_KEY` secret is still valid and the server is reachable
- **Build error** — A code change introduced a TypeScript or compile error; fix the code and push again
- **Disk space on server** — Run `df -h` on server; if full, run `docker system prune -f`

### Database Connection Error

```bash
ssh deploy@89.167.90.112

# Check the DB container is running
docker compose ps voxtera-db

# Check DB logs
docker compose logs voxtera-db --tail=50

# Restart the DB (this does NOT delete data if using a volume)
cd ~/hosting && docker compose restart voxtera-db

# Wait 10 seconds, then restart the server too
sleep 10 && docker compose restart voxtera-server
```

### Container Keeps Crashing

```bash
ssh deploy@89.167.90.112
cd ~/hosting

# See why the container is crashing
docker compose logs voxtera-server --tail=100

# Check environment variables are set correctly
cat ~/hosting/sites/voxtera/.env
```

### Migration Fails

```bash
ssh deploy@89.167.90.112

# View migration error
docker exec voxtera-server npm run migrate 2>&1

# If needed, connect directly to the database and inspect the schema
docker exec -it voxtera-db psql -U voxtera -d voxtera_production
```

---

## 11. Key Links & Access Points

| Resource | URL / Location |
|----------|---------------|
| Live site | https://voxtera.agiletransition.se |
| GitHub repository | https://github.com/Tschiffer46/voxtera |
| GitHub Actions (deploys) | https://github.com/Tschiffer46/voxtera/actions |
| Nginx Proxy Manager | http://89.167.90.112:81 |
| Cloudflare dashboard | https://dash.cloudflare.com |
| Server SSH | `ssh deploy@89.167.90.112` |
| Voxtera files on server | `/home/deploy/hosting/sites/voxtera/` |
| Master Docker Compose | `/home/deploy/hosting/docker-compose.yml` |
| Server env file | `/home/deploy/hosting/sites/voxtera/.env` |
| Database backups | `/home/deploy/backups/` |

---

## 12. How to Make Changes

### Change Application Code

1. Clone the repository (or pull latest changes):
   ```bash
   git clone https://github.com/Tschiffer46/voxtera.git
   # or
   git pull origin main
   ```
2. Create a new branch for your changes:
   ```bash
   git checkout -b my-feature-name
   ```
3. Make your changes in `client/` (frontend) or `server/` (backend)
4. Test locally with `docker-compose up`
5. Push to GitHub and create a pull request
6. After review, merge to `main` — deployment happens automatically

### Run a Database Migration

After adding a new `.sql` file to `server/src/db/migrations/`:

```bash
# After deploying to production
ssh deploy@89.167.90.112
docker exec voxtera-server npm run migrate
```

### Add a New Company

Currently done directly in the database. Connect with:

```bash
docker exec -it voxtera-db psql -U voxtera -d voxtera_production
```

Then run:

```sql
INSERT INTO companies (name, slug) VALUES ('Company Name', 'company-slug');
```

(Once the Admin Panel is built, this will be done through the UI.)

### Add a New Survey

Currently done directly in the database until the Admin Panel (Phase 4) is complete.

```sql
INSERT INTO surveys (company_id, title, description, status)
VALUES (1, 'Q1 2026 Survey', 'Quarterly employee satisfaction', 'draft');
```

### Manage Survey Links

To generate a new anonymous survey link token:

```sql
INSERT INTO survey_links (survey_id, token, organizational_level_id, is_active)
VALUES (1, gen_random_uuid(), 1, true);

-- Get the token
SELECT token FROM survey_links WHERE survey_id = 1;
```

The survey URL for employees will be:
`https://voxtera.agiletransition.se/survey/{token}`

---

*For questions about the codebase architecture, see [ARCHITECTURE.md](ARCHITECTURE.md). For deployment details, see [DEPLOYMENT.md](DEPLOYMENT.md). To recreate the project from scratch, see [BOOTSTRAP.md](../BOOTSTRAP.md).*
