import { router, withCors, OPTIONS } from '@/lib/router';
import { transfersResponseSchema } from '@/app/api/x402/_lib/output-schemas';
import { merchantTransactionsQuerySchema } from '@/app/api/x402/_lib/schemas';
import { extractPathSegment } from '@/app/api/x402/_lib/utils';
import { handleMerchantTransactions } from '@/app/api/x402/_handlers/merchant-transactions';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/merchants/transactions')
    .path('x402/merchants/{address}/transactions')
    .paid('0.01')
    .method('GET')
    .query(merchantTransactionsQuerySchema)
    .output(transfersResponseSchema)
    .description('Paginated transfers where merchant is recipient')
    .handler(({ query, request }) => {
      const address = extractPathSegment(request, 4);
      return handleMerchantTransactions(address, query);
    })
);
