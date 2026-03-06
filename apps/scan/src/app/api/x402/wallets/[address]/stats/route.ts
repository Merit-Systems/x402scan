import { router, withCors, OPTIONS } from '@/lib/router';
import { walletStatsQuerySchema } from '@/app/api/x402/_lib/schemas';
import { handleWalletStats } from '@/app/api/x402/_handlers/wallet-stats';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/wallets/stats')
    .path('x402/wallets/{address}/stats')
    .paid('0.01')
    .method('GET')
    .query(walletStatsQuerySchema)
    .description(
      'Aggregate stats for a wallet (tx count, total amount, unique recipients)'
    )
    .handler(({ query, request }) => {
      const address = request.nextUrl.pathname.split('/')[4]!;
      return handleWalletStats(address, query);
    })
);
