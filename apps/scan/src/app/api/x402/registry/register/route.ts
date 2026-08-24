import { router, withCors, OPTIONS } from '@/lib/router';
import { registerResponseSchema } from '@/app/api/x402/_lib/output-schemas';
import { registryRegisterBodySchema } from '@/app/api/x402/_lib/schemas';
import { handleRegistryRegister } from '@/app/api/x402/_handlers/registry-register';

export { OPTIONS };

export const POST = withCors(
  router
    .route('x402/registry/register')
    .siwx()
    .body(registryRegisterBodySchema)
    .output(registerResponseSchema)
    .description('Register an x402-protected resource')
    .handler(({ body }) => handleRegistryRegister(body))
);
