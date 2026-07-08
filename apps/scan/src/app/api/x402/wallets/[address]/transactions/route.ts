import { router, withCors, OPTIONS } from '@/lib/router';
import { walletTransactionsQuerySchema } from '@/app/api/x402/_lib/schemas';
import { extractPathSegment } from '@/app/api/x402/_lib/utils';
import { handleWalletTransactions } from '@/app/api/x402/_handlers/wallet-transactions';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/wallets/transactions')
    .path('x402/wallets/{address}/transactions')
    .paid('0.01')
    .method('GET')
    .query(walletTransactionsQuerySchema)
    .description('Paginated transfers where wallet is sender')
    .handler(({ query, request }) => {
      const address = extractPathSegment(request, 4);
      return handleWalletTransactions(address, query);
    })
);
