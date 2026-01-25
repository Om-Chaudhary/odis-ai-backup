# PIMS Sync Service Dockerfile
#
# Multi-stage build for Nx monorepo deployment to Railway.
# Uses Microsoft Playwright base image with pre-installed Chromium.
#
# Build: docker build -f apps/pims-sync/Dockerfile -t pims-sync .
# Run: docker run -p 3001:3001 --env-file .env pims-sync

# ============================================
# Stage 1: Build
# ============================================
FROM node:22-slim AS builder

# Install pnpm
RUN npm install -g pnpm@10.23.0

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY nx.json tsconfig.base.json ./

# Copy workspace packages (only what's needed for pims-sync)
COPY apps/pims-sync/package.json apps/pims-sync/
COPY libs/ libs/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/pims-sync/ apps/pims-sync/

# Build pims-sync with Nx
ENV NX_NO_CLOUD=true
RUN pnpm nx build pims-sync --verbose

# ============================================
# Stage 2: Production
# ============================================
FROM mcr.microsoft.com/playwright:v1.58.0-noble

# Environment configuration
ENV HOST=0.0.0.0
ENV PORT=3001
ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm@10.23.0

WORKDIR /app

# Create non-root user for security
RUN groupadd --system pims-sync && \
    useradd --system --gid pims-sync pims-sync

# Copy built application from builder stage
COPY --from=builder /app/dist/apps/pims-sync/main.js ./
COPY --from=builder /app/dist/apps/pims-sync/package.json ./

# Install production dependencies (only playwright - rest is bundled)
RUN pnpm install --prod

# Set ownership to non-root user
RUN chown -R pims-sync:pims-sync /app

# Switch to non-root user
USER pims-sync

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "main.js"]
