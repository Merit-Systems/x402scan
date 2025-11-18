# Facilitator Router

Express application with Cockatiel resilience patterns for handling transient faults.

Built with TypeScript and ESM (ES Modules).

## Setup

Install dependencies:

```bash
pnpm install
```

## Running the Application

For development (with hot reload):

```bash
pnpm dev
```

For production:

```bash
pnpm build
pnpm start
```

The server will run on `http://localhost:3099`.

You can test with `pnpm test:server` and `pnpm test:client` which will run a basic server and client and send 1 cent back and forth.

## Available Endpoints

- `GET /health` - Health check endpoint
- `POST /settle` - Settlement endpoint (to be implemented)
- `POST /verify` - Verification endpoint (to be implemented)

## Cockatiel Patterns Available

The following resilience policies are configured and ready to use:

### Retry Policy

Automatically retries failed operations with exponential backoff:

- Max attempts: 3
- Exponential backoff strategy

### Circuit Breaker

Prevents cascading failures by opening the circuit after consecutive failures:

- Opens after 5 consecutive failures
- Half-open state after 10 seconds

### Timeout Policy

Limits execution time to prevent hanging requests:

- Timeout: 5 seconds
- Strategy: Aggressive (cancels immediately on timeout)

### Combined Policy

All policies can be combined for comprehensive resilience using the `wrap` function:

```typescript
import { wrap } from 'cockatiel';

const resiliencePolicy: IPolicy = wrap(
  retryPolicy,
  circuitBreakerPolicy,
  timeoutPolicy
);
```

## Learn More

- [Cockatiel Documentation](https://github.com/connor4312/cockatiel)
- [Express Documentation](https://expressjs.com/)
