# Multi-stage build for optimized production image
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm ci && npm cache clean --force

# Copy source code (excluding .env to avoid conflicts)
COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY client/ client/
COPY server/ server/
COPY shared/ shared/

# Vérifier la structure
RUN ls -la server/ && echo "Production files:" && ls -la server/*.production.* || echo "No production files found, will use regular files"

# Build the application
# Build frontend first
RUN npx vite build

# Vérifier que les fichiers sont construits
RUN echo "=== BUILD VERIFICATION ===" && \
    ls -la dist/ && \
    echo "Frontend files in dist/public:" && \
    ls -la dist/public/ && \
    echo "index.html exists:" && \
    ls -la dist/public/index.html

# Build backend with production file - no bundling for native modules
RUN npx esbuild server/index.production.ts --platform=node --format=esm --outfile=dist/index.js \
  --external:* --loader:.ts=ts

# Production stage
FROM node:20-alpine AS production

# Install build tools and PostgreSQL client for bcrypt and health checks
RUN apk add --no-cache postgresql-client python3 make g++

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Install ALL dependencies (including bcrypt) for production
COPY --from=build /app/package*.json ./
RUN npm ci && npm cache clean --force

# Copy built application from build stage
COPY --from=build --chown=nextjs:nodejs /app/dist ./dist
COPY --from=build --chown=nextjs:nodejs /app/shared ./shared
COPY --from=build --chown=nextjs:nodejs /app/server ./server

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Install wget for health check
USER root
RUN apk add --no-cache wget
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]