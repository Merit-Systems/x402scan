# Use Node.js LTS
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Build stage
FROM base AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies (no lockfile for standalone deployment)
RUN pnpm install

# Copy source code
COPY src ./src

# Build the application
RUN pnpm build

# Production stage
FROM base AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package.json ./

# Install production dependencies only
RUN pnpm install --prod

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port (Railway will override with PORT env var)
EXPOSE 6969

# Start the server
CMD ["pnpm", "start"]

