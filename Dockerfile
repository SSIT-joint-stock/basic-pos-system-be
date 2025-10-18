# Build stage
FROM node:20 AS dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies with cache optimization
# Skip prepare script to avoid husky installation in Docker
RUN npm ci --only=production --frozen-lockfile --ignore-scripts && \
    npm cache clean --force

# Development dependencies for build
FROM node:20 AS build
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies including dev dependencies
# Skip prepare script to avoid husky installation in Docker
RUN npm ci --frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && \
    npm run build && \
    npm prune --production

# Production stage
FROM node:20 AS runtime

# Install dumb-init for proper signal handling
RUN apt-get update \
 && apt-get install -y --no-install-recommends dumb-init ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs --no-create-home --shell /usr/sbin/nologin nodejs

WORKDIR /app

# Copy production dependencies
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=dependencies --chown=nodejs:nodejs /app/package*.json ./

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma schema (needed for migrations in production)
COPY --from=build --chown=nodejs:nodejs /app/prisma ./prisma

# Copy source templates for docs service
COPY --from=build --chown=nodejs:nodejs /app/src ./src

# Copy health check script
COPY --from=build --chown=nodejs:nodejs /app/docker-health-check.js ./docker-health-check.js

# Create necessary directories with proper permissions before switching user
RUN mkdir -p /app/logs /app/uploads /app/temp && \
    chown -R nodejs:nodejs /app/logs /app/uploads /app/temp && \
    chmod -R 755 /app/logs /app/uploads /app/temp

# Don't copy .env file - use environment variables instead
# COPY --chown=nodejs:nodejs --from=build /app/.env .env

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node docker-health-check.js || exit 1

# Use dumb-init to handle signals properly
CMD ["dumb-init", "npm", "run", "start:prod"]