# @x402scan/rpc-proxy

Standalone HTTP service exposing a single endpoint:

- `GET /balance/:address`
  - EVM addresses return **Base** native balance (ETH)
  - Solana addresses return **Solana** native balance (SOL)

## Configuration

Set environment variables:

- `PORT` (default: `6970`)
- `BASE_RPC_URL` (required for EVM/Base lookups)
- `SOLANA_RPC_URL` (required for Solana lookups)

## Run locally

```bash
pnpm -w -F @x402scan/rpc-proxy dev
```

