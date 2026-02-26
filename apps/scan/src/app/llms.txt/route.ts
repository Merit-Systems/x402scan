import { NextResponse } from 'next/server';

const content = `# x402scan API

x402scan indexes all x402 payment activity on Base and Solana.

## Endpoints

All data endpoints accept optional query params: page (0-indexed), page_size (1-100), chain (base|solana), timeframe (1|7|14|30 days).
All data endpoints cost $0.01 via x402 except /api/data/resources/search ($0.02).

### Send USDC
POST /api/send?amount={amount}&address={address}&chain={base|solana}

### Merchants
GET /api/data/merchants — List top merchants (sort_by: volume|tx_count|unique_buyers)
GET /api/data/merchants/{address}/transactions — Merchant transactions
GET /api/data/merchants/{address}/stats — Merchant stats

### Wallets
GET /api/data/wallets/{address}/transactions — Wallet transactions
GET /api/data/wallets/{address}/stats — Wallet stats

### Facilitators
GET /api/data/facilitators — List top facilitators
GET /api/data/facilitators/stats — Network-wide facilitator stats

### Resources
GET /api/data/resources — List registered x402 resources
GET /api/data/resources/search?q={query} — Search resources (tags, chains filters)
GET /api/data/origins/{id}/resources — Resources for a specific origin
`;

export const GET = () =>
  new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
