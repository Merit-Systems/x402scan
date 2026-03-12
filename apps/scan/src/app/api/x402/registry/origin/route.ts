import { router, withCors, OPTIONS } from '@/lib/router';
import { registryOriginQuerySchema } from '@/app/api/x402/_lib/schemas';
import { handleRegistryOrigin } from '@/app/api/x402/_handlers/registry-origin';

export { OPTIONS };

export const GET = withCors(
  router
    .route('x402/registry/origin')
    .paid('0.01')
    .method('GET')
    .query(registryOriginQuerySchema)
    .description('List all registered x402 resources for an origin')
    .handler(({ query }) => handleRegistryOrigin(query))
);
