# Use Node.js 20 as the base image
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    bash \
    git \
    openssh-client

# Install pnpm and turbo globally
RUN npm install -g pnpm turbo

# Set CI environment variable for pnpm (required for non-TTY environments)
ENV CI=true

# Builder stage
FROM base AS builder

# Set working directory
WORKDIR /app

# Declare build arguments for environment variables needed during build
ARG NODE_ENV
ARG PORT
ARG CLICKHOUSE_HOST
ARG CLICKHOUSE_USER
ARG CLICKHOUSE_PASSWORD
ARG CLICKHOUSE_DATABASE

# Set environment variables from build arguments
ENV NODE_ENV=$NODE_ENV
ENV PORT=$PORT
ENV CLICKHOUSE_HOST=$CLICKHOUSE_HOST
ENV CLICKHOUSE_USER=$CLICKHOUSE_USER
ENV CLICKHOUSE_PASSWORD=$CLICKHOUSE_PASSWORD
ENV CLICKHOUSE_DATABASE=$CLICKHOUSE_DATABASE

# Copy workspace configuration files
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY tsconfig.base.json ./
COPY turbo.json ./

# Copy internal packages that the proxy depends on
COPY packages/internal/databases/analytics/ ./packages/internal/databases/analytics/
COPY packages/internal/configurations/ ./packages/internal/configurations/

# Copy the proxy app
COPY apps/proxy/ ./apps/proxy/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the proxy and its dependencies using turbo
RUN turbo build --filter=x402proxy

# Runner stage
FROM base AS runner

WORKDIR /app

# Declare runtime environment variables
ARG NODE_ENV
ARG PORT
ARG ANALYTICS_CLICKHOUSE_URL
ARG ANALYTICS_CLICKHOUSE_USER
ARG ANALYTICS_CLICKHOUSE_PASSWORD
ARG ANALYTICS_CLICKHOUSE_DATABASE

# Set environment variables from build arguments
ENV NODE_ENV=$NODE_ENV
ENV PORT=$PORT
ENV ANALYTICS_CLICKHOUSE_URL=$ANALYTICS_CLICKHOUSE_URL
ENV ANALYTICS_CLICKHOUSE_USER=$ANALYTICS_CLICKHOUSE_USER
ENV ANALYTICS_CLICKHOUSE_PASSWORD=$ANALYTICS_CLICKHOUSE_PASSWORD
ENV ANALYTICS_CLICKHOUSE_DATABASE=$ANALYTICS_CLICKHOUSE_DATABASE

# Copy workspace configuration files from builder
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./

# Copy internal packages from builder (both source and built artifacts)
COPY --from=builder /app/packages/internal/databases/analytics/package.json ./packages/internal/databases/analytics/package.json
COPY --from=builder /app/packages/internal/databases/analytics/dist/ ./packages/internal/databases/analytics/dist/
COPY --from=builder /app/packages/internal/configurations/ ./packages/internal/configurations/

# Copy the proxy app from builder
COPY --from=builder /app/apps/proxy/package.json ./apps/proxy/package.json
COPY --from=builder /app/apps/proxy/dist/ ./apps/proxy/dist/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Expose the port that the proxy runs on
EXPOSE 6969

# Start the proxy server
WORKDIR /app/apps/proxy
CMD ["pnpm", "start"]