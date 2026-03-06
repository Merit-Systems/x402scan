import { router, withCors, OPTIONS } from '@/lib/router';
import { registryRegisterOriginBodySchema } from '@/app/api/x402/_lib/schemas';
import { handleRegistryRegisterOrigin } from '@/app/api/x402/_handlers/registry-register-origin';

export { OPTIONS };

export const POST = withCors(
  router
    .route('x402/registry/register-origin')
    .siwx()
    .body(registryRegisterOriginBodySchema)
    .description('Discover and register all x402 resources from an origin')
    .handler(({ body }) => handleRegistryRegisterOrigin(body))
);
