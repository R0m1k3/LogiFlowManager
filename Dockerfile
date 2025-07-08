# Multi-stage build for LogiFlow application
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S logiflow -u 1001

# Copy built application from build stage
COPY --from=build --chown=logiflow:nodejs /app/dist ./dist
COPY --from=build --chown=logiflow:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=logiflow:nodejs /app/package*.json ./

# Switch to non-root user
USER logiflow

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV USE_LOCAL_AUTH=true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server/index.js"]