import { createRouter } from '@agentcash/router';

import { env } from '@/env';

import type { NextRequest } from 'next/server';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, X-Payment, SIGN-IN-WITH-X, PAYMENT-REQUIRED',
};

export const router = createRouter({
  baseUrl: env.NEXT_PUBLIC_APP_URL,
  payeeAddress:
    env.X402_PAYEE_ADDRESS ?? '0x0000000000000000000000000000000000000001',
  network: 'eip155:8453',
  discovery: {
    title: 'x402scan',
    version: '1.0.0',
    description:
      'Query indexed x402 payment data and send USDC on Base and Solana.',
    contact: {
      name: 'Merit Systems',
      url: 'https://merit.systems',
    },
    guidance: `x402scan is a payment data explorer and registry for the x402 protocol.

## Authentication
- Most data endpoints require a $0.01–$0.02 x402 micropayment (use fetch with X-Payment header).
- Registry write endpoints (register, register-origin) require SIWX wallet authentication (use fetch_with_auth).

## Data endpoints ($0.01–$0.02 each)
- GET /api/x402/wallets/{address}/transactions — paginated transfers where wallet is sender
- GET /api/x402/wallets/{address}/stats — aggregate stats for a wallet
- GET /api/x402/buyers — top senders by volume
- GET /api/x402/merchants — top recipients by volume
- GET /api/x402/merchants/{address}/transactions — paginated transfers where merchant is recipient
- GET /api/x402/merchants/{address}/stats — aggregate stats for a merchant
- GET /api/x402/facilitators — list of facilitators with stats
- GET /api/x402/facilitators/stats — overall facilitator stats
- GET /api/x402/resources — all indexed x402 resources
- GET /api/x402/resources/search?q= — full-text search across resources ($0.02)
- GET /api/x402/origins/{id}/resources — resources for a specific origin
- GET /api/x402/registry/origin?url= — all registered resources for an origin

## Registry endpoints (SIWX, free)
- POST /api/x402/registry/register — register a single x402 resource by URL
- POST /api/x402/registry/register-origin — discover and register all resources from an origin via OpenAPI or .well-known/x402

## Public programmatic API (no auth, free)
- POST /api/v1/resources/register — register a single x402 resource by URL (JSON body: {"url": "..."})
- POST /api/v1/resources/register-origin — discover and register all x402 resources from an origin (JSON body: {"origin": "..."})
- POST /api/v1/resources/refresh — re-probe and update an existing resource (JSON body: {"url": "..."})

## Send endpoint (x402, dynamic price)
- POST /api/x402/send — send USDC to an address on Base or Solana`,
  },
});

export function withCors(
  handler: (req: NextRequest) => Promise<Response>
): (req: NextRequest) => Promise<Response> {
  return async req => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    const response = await handler(req);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  };
}

export const OPTIONS = () =>
  new Response(null, { status: 204, headers: corsHeaders });
