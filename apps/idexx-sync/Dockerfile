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

# Install pnpm (corepack in base image has outdated signing keys)
RUN npm install -g pnpm@10.23.0

WORKDIR /app

# Create non-root user for security
RUN groupadd --system idexx-sync && \
    useradd --system --gid idexx-sync idexx-sync

# Copy built application from Nx build output
COPY dist/apps/idexx-sync/main.js ./
COPY dist/apps/idexx-sync/package.json ./

# Install production dependencies (only playwright - rest is bundled)
RUN pnpm install --prod

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
