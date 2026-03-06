import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    version: 1,
    description:
      'x402scan — Query indexed x402 payment data and send USDC on Base and Solana.',
    instructions: `Data API: GET /api/x402/* endpoints return paginated x402 payment data.
All data endpoints cost $0.01 except /api/x402/resources/search ($0.02).
Common query params: page (0-indexed), page_size (1-100), chain (base|solana), timeframe (1|7|14|30 days).
Send API: POST /api/x402/send with query params address, amount, chain.
Registry API: Register x402 resources into the index.
  POST /api/x402/registry/register — JSON body { url } — probes URL for 402, registers resource.
  POST /api/x402/registry/register-origin — JSON body { origin } — discovers and registers all resources from origin.
  GET /api/x402/registry/origin?url=<origin> — list registered resources for an origin.`,
    resources: [
      'POST /api/x402/send',
      'GET /api/x402/wallets/{address}/transactions',
      'GET /api/x402/wallets/{address}/stats',
      'GET /api/x402/merchants',
      'GET /api/x402/merchants/{address}/transactions',
      'GET /api/x402/merchants/{address}/stats',
      'GET /api/x402/facilitators',
      'GET /api/x402/facilitators/stats',
      'GET /api/x402/resources',
      'GET /api/x402/resources/search',
      'GET /api/x402/origins/{id}/resources',
      'POST /api/x402/registry/register',
      'POST /api/x402/registry/register-origin',
      'GET /api/x402/registry/origin',
    ],
    ownershipProofs: [],
  });
}
