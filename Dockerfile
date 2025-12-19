# Build stage - compile native dependencies
FROM node:20-alpine AS builder

# Install build dependencies for native modules (bcrypt, better-sqlite3, sharp)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    libc-dev \
    pkgconfig \
    pixman-dev \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev

# Install pnpm
RUN npm install -g pnpm@9

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (including native modules)
RUN pnpm install --frozen-lockfile --prod=false

# Copy application code
COPY . .

# Build Astro application
RUN pnpm build

# Prune dev dependencies
RUN pnpm prune --prod

# Runtime stage - minimal image for production
FROM node:20-alpine AS runtime

# Install runtime dependencies for native modules
RUN apk add --no-cache \
    libstdc++ \
    libgcc

# Create app directory
WORKDIR /app

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R node:node /app/data

# Copy built application from builder
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/db ./db

# Switch to non-root user
USER node

# Expose port (Fly.io uses internal port 8080 by default)
EXPOSE 8080

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the server
CMD ["node", "./dist/server/entry.mjs"]
