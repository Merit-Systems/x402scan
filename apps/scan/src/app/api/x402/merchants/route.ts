import { router, withCors, OPTIONS } from '@/lib/router';
import { merchantsListQuerySchema } from '@/app/api/x402/_lib/schemas';
import { handleMerchants } from '@/app/api/x402/_handlers/merchants';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/merchants')
    .paid('0.01')
    .method('GET')
    .query(merchantsListQuerySchema)
    .description('Paginated list of merchants (top recipients by volume)')
    .handler(({ query }) => handleMerchants(query))
);
