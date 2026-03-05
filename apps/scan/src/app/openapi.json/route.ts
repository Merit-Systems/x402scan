import { NextResponse } from 'next/server';
import { router } from '@/lib/router';
import '@/lib/routes-barrel';

import type { NextRequest } from 'next/server';

const routerHandler = router.openapi({
  title: 'x402scan',
  version: '1.0.0',
  description:
    'Query indexed x402 payment data and send USDC on Base and Solana.',
});

export async function GET(req: NextRequest) {
  const res = await routerHandler(req);
  const spec = await res.json();

  spec.paths['/api/send'] = {
    post: {
      operationId: 'send',
      summary: 'Send USDC to an address on Base or Solana',
      tags: ['Send'],
      'x-payment-info': {
        pricingMode: 'dynamic',
        description: 'Price matches the amount query parameter',
        protocols: ['x402'],
      },
      parameters: [
        {
          in: 'query',
          name: 'amount',
          required: true,
          schema: { type: 'number' },
          description: 'Amount of USDC to send (also the x402 payment price)',
        },
        {
          in: 'query',
          name: 'address',
          required: true,
          schema: { type: 'string' },
          description: 'Recipient wallet address (EVM or Solana)',
        },
        {
          in: 'query',
          name: 'chain',
          required: true,
          schema: { type: 'string', enum: ['base', 'solana'] },
          description: 'Target chain',
        },
      ],
      responses: {
        '200': { description: 'Successful response' },
        '402': { description: 'Payment Required' },
      },
    },
  };

  return NextResponse.json(spec);
}
