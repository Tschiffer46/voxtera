# Voxtera — Multi-stage production build
# Builds both React client and Express server into a single container.

# ── Stage 1: Build React client ──────────────────────────────────
FROM node:20-alpine AS client-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Build Express server ────────────────────────────────
FROM node:20-alpine AS server-build

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/ ./
RUN npm run build

# ── Stage 3: Production runner ───────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy compiled server code
COPY --from=server-build /app/server/dist ./dist

# Copy SQL migration files (TypeScript compiler doesn't copy .sql)
COPY server/src/db/migrations ./dist/db/migrations

# Copy built client files — served by Express as static files
COPY --from=client-build /app/client/dist ./public

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "dist/index.js"]
