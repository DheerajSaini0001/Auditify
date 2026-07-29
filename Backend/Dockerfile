# Base image version must match the "playwright" version in package-lock.json
FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

COPY package*.json ./
# postinstall runs "npx playwright install chromium --with-deps";
# the base image already ships matching browsers, so it's a fast no-op
RUN npm ci

COPY . .

ENV NODE_ENV=production
EXPOSE 2000

CMD ["node", "server.js"]
