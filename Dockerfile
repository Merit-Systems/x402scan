# Use Node.js 20 as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    bash \
    git \
    openssh-client

# Install pnpm and turbo globally
RUN npm install -g pnpm turbo

# Set CI environment variable for pnpm (required for non-TTY environments)
ENV CI=true

# Declare build arguments for environment variables
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

# Copy entire monorepo
COPY . .

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the proxy and its dependencies using turbo
# The "..." suffix includes all dependencies in the build
RUN turbo build --filter=x402proxy...

# Expose the port that the proxy runs on
EXPOSE 6969

# Start the proxy server
WORKDIR /app/apps/proxy
CMD ["pnpm", "start"]