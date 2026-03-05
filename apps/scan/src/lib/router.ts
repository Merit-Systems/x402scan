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
  payeeAddress: env.X402_PAYEE_ADDRESS,
  network: 'eip155:8453',
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
