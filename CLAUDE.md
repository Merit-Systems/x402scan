# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

x402scan is an ecosystem explorer for x402 (a standard for digital payments) built as a pnpm monorepo. The project consists of:

- **scan/** - Next.js 15 web application (main frontend at x402scan.com)
- **sync/** - Background sync service using Trigger.dev for blockchain data indexing
- **facilitators/** - Shared facilitator configuration used across both workspaces

## Development Commands

### Initial Setup

```bash
# Install dependencies
pnpm install

# Copy facilitator images to scan/public/
# This happens automatically via postinstall in scan/
```

### Running the Application

```bash
# Run the frontend (scan workspace)
pnpm dev              # or pnpm dev:scan

# Run the sync service (background jobs)
pnpm dev:sync

# Run specific workspace commands
pnpm --filter scan <command>
pnpm --filter sync <command>
```

### Building

```bash
# Build everything
pnpm build

# Build specific workspaces
pnpm build:scan
pnpm build:sync
```

### Linting & Formatting

```bash
# Lint all workspaces
pnpm lint

# Lint specific workspace
pnpm lint:scan
pnpm lint:sync

# Format all files
pnpm format

# Check formatting (don't modify)
pnpm check:format

# Run all checks (format, types, lint)
pnpm check
```

### Type Checking

```bash
# Check all types (includes facilitators validation)
pnpm check:types

# Check specific workspace
pnpm check:types:scan
pnpm check:types:sync

# Validate facilitators configuration
pnpm check:facilitators
```

### Database Commands

**Scan workspace (main app database):**

```bash
# Generate Prisma client
pnpm --filter scan db:generate

# Push schema changes (dev)
pnpm --filter scan db:push

# Run migrations (dev)
pnpm --filter scan db:migrate:dev

# Run migrations (production)
pnpm --filter scan db:migrate:prod

# Open Prisma Studio
pnpm db:studio:scan

# Open Prisma Studio for transfers DB
pnpm --filter scan db:studio:transfers
```

**Sync workspace (background job database):**

```bash
pnpm --filter sync db:generate
pnpm --filter sync db:push
pnpm --filter sync db:migrate:dev
pnpm --filter sync db:migrate:prod
pnpm db:studio:sync
```

### Testing

```bash
# Run tests (scan workspace)
pnpm --filter scan test

# Run tests once (no watch)
pnpm --filter scan test:run
```

### Trigger.dev (Background Jobs)

```bash
# Run trigger.dev locally
pnpm trigger:dev          # or pnpm --filter sync trigger:dev

# Deploy to Trigger.dev
pnpm trigger:deploy       # or pnpm --filter sync trigger:deploy
```

## Architecture

### scan/ - Next.js Application

**Tech Stack:**

- Next.js 15 with App Router
- React 19
- Turbopack (dev and build)
- tRPC for type-safe API
- Prisma with PostgreSQL (Neon with read replicas)
- NextAuth for authentication
- Tailwind CSS v4
- Radix UI components
- Coinbase CDP SDK & x402 SDK

**Key Directories:**

- `src/app/` - Next.js App Router pages and layouts
- `src/trpc/routers/` - tRPC API routes (developer, networks, resources, admin, user, public)
- `src/services/` - Business logic (agent, cdp, db, facilitator, labeling, scraper, tools, transfers)
- `src/lib/` - Utilities and shared code
- `src/components/` - React components
- `src/auth/` - NextAuth configuration
- `prisma/` - Main database schema
- `prisma-transfers/` - Separate transfers database schema

**Database Setup:**

- Uses TWO separate Prisma schemas:
  - `prisma/schema.prisma` - Main app database
  - `prisma-transfers/schema.prisma` - Transfers/transactions database
- Both schemas must be generated: `pnpm db:generate` runs both
- Supports read replicas via `@prisma/extension-read-replicas`

**Environment Variables:**
Check [scan/.env.example](scan/.env.example) for required environment variables including:

- `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` - Main database
- `TRANSFERS_DB_URL` (+ optional replicas) - Transfers database
- CDP API keys for Coinbase integration
- `REDIS_URL` for caching

### sync/ - Background Sync Service

**Tech Stack:**

- Trigger.dev v4 for scheduled jobs
- Prisma with PostgreSQL
- Blockchain data fetching (Base, Solana, Polygon)
- Google Cloud BigQuery integration

**Key Files:**

- `trigger/sync.ts` - Main sync task configuration
- `trigger/fetch/` - Blockchain data fetching logic
- `trigger/chains/` - Chain-specific sync configurations
- `db/services.ts` - Database operations for transfers

**Purpose:**

- Scheduled jobs to sync blockchain transfer events from facilitators
- Indexes transactions from x402 facilitator addresses
- Stores transfer data in the transfers database

### facilitators/ - Shared Configuration

**Key Files:**

- `facilitators/config.ts` - Central facilitator configuration
- `facilitators/images/` - Facilitator logos (auto-copied to scan/public/)

**Structure:**
Each facilitator includes:

- ID, name, image, link, color
- Addresses per blockchain chain (Base, Solana, Polygon)
- Per-address config: token, sync start date, enabled flag

**Adding a Facilitator:**

1. Add logo to `facilitators/images/`
2. Add config to `_FACILITATORS` array in `config.ts`
3. Run `pnpm check:facilitators` to validate

## Code Patterns

### tRPC API

- All API routes are in `scan/src/trpc/routers/`
- Use procedures defined in `scan/src/trpc/trpc.ts`
- Public procedures, protected procedures (require auth), and admin procedures available

### Database Queries

- Main DB services in `scan/src/services/db/`
- Transfers DB services in `scan/src/services/transfers/`
- Use Prisma client, consider read replicas for heavy reads

### Caching

- Redis caching utilities in `scan/src/lib/redis.ts`
- Cache helpers in `scan/src/lib/cache.ts`

### x402 Integration

- x402 SDK utilities in `scan/src/lib/x402/`
- CDP (Coinbase) integration in `scan/src/services/cdp/`
- Facilitator helpers in `scan/src/services/facilitator/`

### AI/Agent Features

- Agent services in `scan/src/services/agent/`
- Uses OpenAI SDK and Laminar AI (`@lmnr-ai/lmnr`)
- Message schema in `scan/src/lib/message-schema.ts`

## Notes

- The project uses Turbopack for faster builds (both dev and production)
- Environment validation via `@t3-oss/env-nextjs` in `scan/src/env.ts`
- Monorepo workspace filtering: `pnpm --filter <workspace>` for workspace-specific commands
- Facilitator images are automatically copied to `scan/public/` on `pnpm install` via postinstall script
- Two separate Zod versions: `zod` (v4) and `zod3` (v3) for compatibility
