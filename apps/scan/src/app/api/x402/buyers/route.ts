import { router, withCors, OPTIONS } from '@/lib/router';
import { buyersListQuerySchema } from '@/app/api/x402/_lib/schemas';
import { handleBuyers } from '@/app/api/x402/_handlers/buyers';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/buyers')
    .paid('0.01')
    .method('GET')
    .query(buyersListQuerySchema)
    .description('Paginated list of buyers (top senders by volume)')
    .handler(({ query }) => handleBuyers(query))
);
