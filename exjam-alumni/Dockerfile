# ExJAM Alumni - Production Docker Configuration
# Multi-stage build for optimal image size and security

# ==========================================
# Base stage with Node.js and dependencies
# ==========================================
FROM node:18-alpine AS base

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat postgresql-client
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# ==========================================
# Dependencies stage
# ==========================================
FROM base AS deps

# Install dependencies based on the preferred package manager
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# ==========================================
# Builder stage
# ==========================================
FROM base AS builder

WORKDIR /app

# Copy all dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Set production environment
ENV NODE_ENV production

# Build the application
RUN npm run build

# ==========================================
# Runner stage - Final production image
# ==========================================
FROM node:18-alpine AS runner

# Security: create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache postgresql-client

# Copy built application
COPY --from=builder /app/public ./public

# Set correct permissions for pre-built assets
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy build artifacts with correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy deployment scripts
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Create startup script
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh
set -e

echo "🚀 Starting ExJAM Alumni application..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until pg_isready -h "$DATABASE_HOST" -p "${DATABASE_PORT:-5432}" -U "$DATABASE_USER"; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "✅ Database is ready!"

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "🌟 Starting Next.js application..."
exec "$@"
EOF

RUN chmod +x /app/start.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Environment variables
ENV PORT 3000
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
ENTRYPOINT ["/app/start.sh"]
CMD ["node", "server.js"]