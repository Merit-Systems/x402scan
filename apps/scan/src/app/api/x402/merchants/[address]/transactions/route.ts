import { router, withCors, OPTIONS } from '@/lib/router';
import { merchantTransactionsQuerySchema } from '@/app/api/x402/_lib/schemas';
import { handleMerchantTransactions } from '@/app/api/x402/_handlers/merchant-transactions';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/merchants/transactions')
    .path('x402/merchants/{address}/transactions')
    .paid('0.01')
    .method('GET')
    .query(merchantTransactionsQuerySchema)
    .description('Paginated transfers where merchant is recipient')
    .handler(({ query, request }) => {
      const address = request.nextUrl.pathname.split('/')[4]!;
      return handleMerchantTransactions(address, query);
    })
);
