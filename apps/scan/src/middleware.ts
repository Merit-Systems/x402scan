import { NextResponse } from 'next/server';

import { paymentMiddleware } from 'x402-next';

import { coinbase } from 'facilitators';

import { sendUsdcQueryParamsSchema } from './lib/schemas';

import type { NextRequest } from 'next/server';
import type { Address as EthereumAddress } from 'viem';
import type { Address as SolanaAddress } from '@solana/kit';

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/api/send') {
    const { amount, address, chain } = sendUsdcQueryParamsSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams)
    );
    return paymentMiddleware(
      address as EthereumAddress | SolanaAddress,
      {
        '/api/send': {
          price: `$${amount}`,
          network: chain,
        },
      },
      coinbase
    )(req);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/send'],
  runtime: 'nodejs',
};
