# ─── Backend Dockerfile ──────────────────────────────────────────
# Multi-stage build for production Node.js application

FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching optimization)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ─── Production Stage ────────────────────────────────────────────
FROM node:18-alpine

# Security: run as non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p src/uploads/complaints && chown -R appuser:appgroup /app

USER appuser

# Environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/healthz || exit 1

CMD ["node", "server.js"]
