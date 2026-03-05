import { router } from '@/lib/router';
import '@/lib/routes-barrel';

const routerHandler = router.openapi({
  title: 'x402scan',
  version: '1.0.0',
  description:
    'Query indexed x402 payment data and send USDC on Base and Solana.',
});

export const GET = routerHandler;
