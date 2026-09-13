import { DockerDoctorRequest, DockerDoctorResponse, DockerFramework } from "@/types";

interface FrameworkTemplate {
  framework: DockerFramework;
  dockerfile: string;
  dockerCompose: string;
  dockerIgnore: string;
  improvements: string[];
}

const TEMPLATES: Record<string, FrameworkTemplate> = {
  "Next.js": {
    framework: "Next.js",
    dockerfile: `# ------------------------------------------------------------------------------
# 1. Base Image with Node.js Alpine
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ------------------------------------------------------------------------------
# 2. Dependencies Layer
# ------------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN \\
  if [ -f package-lock.json ]; then npm ci; \\
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \\
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \\
  else npm i; \\
  fi

# ------------------------------------------------------------------------------
# 3. Builder Layer
# ------------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ------------------------------------------------------------------------------
# 4. Production Runner (Minimal & Non-Root)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \\
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
# Set permissions for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]`,
    dockerCompose: `version: "3.8"

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: nextjs_app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/status || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3`,
    dockerIgnore: `node_modules
.next
.git
.env*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store`,
    improvements: [
      "Multi-stage build isolating build tools from the final production runner.",
      "Uses Next.js standalone output to minimize image footprint under 150MB.",
      "Runs as unprivileged system user (nextjs:nodejs uid 1001) for security.",
      "Includes layer-cached dependency installation and healthcheck.",
    ],
  },
  "Python (FastAPI/Flask)": {
    framework: "Python (FastAPI/Flask)",
    dockerfile: `# ------------------------------------------------------------------------------
# Production Python Dockerfile (FastAPI / Flask / Uvicorn)
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-warn-script-location -r requirements.txt

# ------------------------------------------------------------------------------
# Final Lightweight Runner
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS runner

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    PATH="/home/appuser/.local/bin:$PATH"

RUN useradd -u 1001 -m -s /bin/bash appuser

COPY --from=builder /root/.local /home/appuser/.local
COPY --chown=appuser:appuser . .

USER appuser
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`,
    dockerCompose: `version: "3.8"

services:
  api:
    build: .
    container_name: python_api
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    healthcheck:
      test: ["CMD", "python3", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 30s
      timeout: 5s
      retries: 3`,
    dockerIgnore: `__pycache__
*.pyc
*.pyo
*.pyd
.env
.venv
env/
venv/
.git`,
    improvements: [
      "Two-stage build eliminating build-essential compiler tools from runtime.",
      "Non-root 'appuser' UID 1001 prevents container breakout vulnerabilities.",
      "Optimized bytecode and cache flags for rapid boot times.",
    ],
  },
  "Go": {
    framework: "Go",
    dockerfile: `# ------------------------------------------------------------------------------
# Go Multi-stage Dockerfile
# ------------------------------------------------------------------------------
FROM golang:1.22-alpine AS builder

WORKDIR /app
RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/server .

# ------------------------------------------------------------------------------
# Scratch minimal container
# ------------------------------------------------------------------------------
FROM scratch AS runner

WORKDIR /app
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/server /app/server

EXPOSE 8080
ENTRYPOINT ["/app/server"]`,
    dockerCompose: `version: "3.8"

services:
  app:
    build: .
    container_name: go_service
    restart: unless-stopped
    ports:
      - "8080:8080"`,
    dockerIgnore: `.git
bin/
*.exe
.env`,
    improvements: [
      "Scratch base image results in a microscopic container (< 25MB).",
      "Static binary compilation with stripped debug symbols (`-w -s`).",
      "SSL CA certificates included for outbound HTTPS calls.",
    ],
  },
};

export function diagnoseOrGenerateDocker(request: DockerDoctorRequest): DockerDoctorResponse {
  const query = `${request.descriptionOrError} ${request.existingDockerfile || ""}`.toLowerCase();

  // If in debug mode with a known error
  if (request.mode === "debug" || query.includes("error") || query.includes("failed") || query.includes("eacces")) {
    if (query.includes("eacces") || query.includes("permission denied")) {
      return {
        mode: "debug",
        summary: "Docker permission error: Container process cannot write to workdir or npm cache as restricted non-root user.",
        dockerfile: `# Fix: Ensure correct directory ownership before switching to USER\n` +
          `USER root\n` +
          `RUN mkdir -p /app && chown -R 1001:1001 /app\n` +
          `USER 1001\n` +
          `WORKDIR /app`,
        keyImprovements: [
          "Added 'chown -R 1001:1001 /app' before dropping root privileges.",
          "Ensures application user has explicit write access to workdir.",
        ],
        runCommands: [
          { command: "docker build --no-cache -t app .", explanation: "Rebuild container without stale layer cache." },
          { command: "docker run --rm -it app whoami", explanation: "Verify container user identity." },
        ],
        confidence: "high",
      };
    }
  }

  // Framework match
  const selectedFramework = request.framework || "Next.js";
  const matched = TEMPLATES[selectedFramework] || TEMPLATES["Next.js"];

  return {
    mode: request.mode,
    summary: `Production-ready, multi-stage ${matched.framework} container configuration with non-root security and volume caching.`,
    dockerfile: matched.dockerfile,
    dockerCompose: matched.dockerCompose,
    dockerIgnore: matched.dockerIgnore,
    keyImprovements: matched.improvements,
    runCommands: [
      { command: "docker compose up --build -d", explanation: "Builds images and starts containers in detached background mode." },
      { command: "docker compose logs -f", explanation: "Follows real-time container log output." },
      { command: "docker compose down", explanation: "Gracefully stops and cleans up containers and networks." },
    ],
    confidence: "high",
  };
}
