# IDEXX Neo Sync Service Dockerfile
#
# Uses Microsoft Playwright base image with pre-installed Chromium.
# Deployed to Railway via Docker.
#
# Prerequisites:
#   nx build idexx-sync
#   nx prune idexx-sync
#
# Build: nx docker:build idexx-sync
# Run: docker run -p 3001:3001 --env-file .env idexx-sync

FROM mcr.microsoft.com/playwright:v1.49.1-noble

# Environment configuration
ENV HOST=0.0.0.0
ENV PORT=3001
ENV NODE_ENV=production

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

WORKDIR /app

# Create non-root user for security
RUN groupadd --system idexx-sync && \
    useradd --system --gid idexx-sync idexx-sync

# Copy built application and dependencies from Nx build output
# This expects `nx build idexx-sync && nx prune idexx-sync` to have been run
COPY dist/apps/idexx-sync/ ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy workspace modules if present (from nx copy-workspace-modules)
COPY dist/apps/idexx-sync/workspace_modules/ ./workspace_modules/ 2>/dev/null || true

# Set ownership to non-root user
RUN chown -R idexx-sync:idexx-sync /app

# Switch to non-root user
USER idexx-sync

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "main.js"]
