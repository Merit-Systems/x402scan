# Use Node.js 20 as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Set CI environment variable for pnpm (required for non-TTY environments)
ENV CI=true

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

# Install system dependencies
RUN apk add --no-cache \
    bash \
    git \
    openssh-client

# Copy pnpm workspace and lock files for dependency installation
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY tsconfig.base.json ./

# Copy proxy package files
COPY proxy/ ./proxy/

# Install all workspace dependencies
WORKDIR /app
RUN pnpm install

# Build the proxy
WORKDIR /app/proxy
RUN pnpm build

# Install production dependencies only (CI env var already set)
WORKDIR /app/proxy
RUN pnpm install --prod

# Expose the port that the proxy runs on
EXPOSE 6969

# Start the proxy server
CMD ["pnpm", "start"]

