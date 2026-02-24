import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    version: 1,
    description:
      'x402scan — Query indexed x402 payment data and send USDC on Base and Solana.',
    instructions: `Data API: GET /api/data/* endpoints return paginated x402 payment data.
All data endpoints cost $0.01 except /api/data/resources/search ($0.02).
Common query params: page (0-indexed), page_size (1-100), chain (base|solana), timeframe (1|7|14|30 days).
Send API: POST /api/send with query params address, amount, chain.`,
    resources: [
      'POST /api/send',
      'GET /api/data/wallets/{address}/transactions',
      'GET /api/data/wallets/{address}/stats',
      'GET /api/data/merchants',
      'GET /api/data/merchants/{address}/transactions',
      'GET /api/data/merchants/{address}/stats',
      'GET /api/data/facilitators',
      'GET /api/data/facilitators/stats',
      'GET /api/data/resources',
      'GET /api/data/resources/search',
      'GET /api/data/origins/{id}/resources',
    ],
    ownershipProofs: [],
  });
}
