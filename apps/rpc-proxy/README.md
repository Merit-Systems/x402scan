# @x402scan/rpc-proxy

Standalone HTTP service exposing a single endpoint:

- `GET /balance/:address`
  - EVM addresses return **Base USDC** (ERC-20) balance

## Configuration

Set environment variables:

- `PORT` (default: `6970`)
- `BASE_RPC_URL` (required for EVM/Base lookups)

## Run locally

```bash
pnpm -w -F @x402scan/rpc-proxy dev
```
