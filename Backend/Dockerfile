# Base image version must match the "playwright" version in package-lock.json
FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

COPY package*.json ./
# postinstall runs "npx playwright install chromium --with-deps";
# the base image already ships matching browsers, so it's a fast no-op
RUN npm ci

COPY . .

ENV NODE_ENV=production
# Persist V8's compile cache across worker spawns: every audit boots a fresh
# worker_thread that re-compiles the whole metric-service module graph; with
# this set, recompiles hit the on-disk cache instead (~0.3-1s saved per audit).
ENV NODE_COMPILE_CACHE=/tmp/node-compile-cache
EXPOSE 2000

CMD ["node", "server.js"]
