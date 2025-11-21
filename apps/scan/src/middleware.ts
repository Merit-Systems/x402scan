import { NextResponse } from 'next/server';

import { paymentMiddleware } from 'x402-next';

import { coinbase } from 'facilitators';

import { sendUsdcQueryParamsSchema } from './lib/schemas';

import type { NextRequest } from 'next/server';
import type { Address as EthereumAddress } from 'viem';
import type { Address as SolanaAddress } from '@solana/kit';

const x402MiddlewareFactory = (req: NextRequest) => {
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
  );
};

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/api/send') {
    const x402Middleware = x402MiddlewareFactory(req);
    return x402Middleware(req);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/send'],
  runtime: 'nodejs',
};
