import { router } from '@/lib/router';
import { env } from '@/env';
import '@/lib/routes-barrel';

const routerHandler = router.openapi({
  title: 'x402scan',
  version: '1.0.0',
  description:
    'Query indexed x402 payment data and send USDC on Base and Solana.',
  baseUrl: env.NEXT_PUBLIC_APP_URL,
  contact: {
    name: 'Merit Systems',
    url: 'https://merit.systems',
  },
});

export const GET = routerHandler;
