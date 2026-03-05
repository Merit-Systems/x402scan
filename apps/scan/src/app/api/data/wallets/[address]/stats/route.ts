import { router, withCors, OPTIONS } from '@/lib/router';
import { walletStatsQuerySchema } from '@/app/api/data/_lib/schemas';
import { parseAddress, jsonResponse } from '@/app/api/data/_lib/utils';
import { getWalletStats } from '@/services/transfers/wallets/stats';

export { OPTIONS };

export const GET = withCors(
  router
    .route('data/wallets/stats')
    .paid('0.01')
    .method('GET')
    .query(walletStatsQuerySchema)
    .description(
      'Aggregate stats for a wallet (tx count, total amount, unique recipients)'
    )
    .handler(async ({ query, request }) => {
      const rawAddress = request.nextUrl.pathname.split('/')[4]!;
      const addr = parseAddress(rawAddress);
      if (!addr.success) return addr.response;

      const { chain, timeframe } = query;
      const stats = await getWalletStats({
        address: addr.data,
        chain,
        timeframe: timeframe ?? 0,
      });
      return jsonResponse({ data: stats });
    })
);
