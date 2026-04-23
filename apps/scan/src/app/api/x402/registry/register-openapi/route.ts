import { router, withCors, OPTIONS } from '@/lib/router';
import { handleRegistryRegisterOpenApi } from '@/app/api/x402/_handlers/registry-register-openapi';
import { z } from 'zod';

export { OPTIONS };

const openApiBodySchema = z.object({
  spec: z
    .union([z.string(), z.record(z.unknown())])
    .describe(
      'OpenAPI specification as JSON string or parsed object with x-402 extensions'
    ),
  baseUrl: z
    .string()
    .url()
    .optional()
    .describe(
      'Optional base URL to prepend to path-only endpoints (overrides servers array)'
    ),
});

export const POST = withCors(
  router
    .route('x402/registry/register-openapi')
    .siwx()
    .body(openApiBodySchema)
    .description(
      'Register x402 resources from an OpenAPI specification with x-402 extensions'
    )
    .handler(({ body }) =>
      handleRegistryRegisterOpenApi(body.spec as string, body.baseUrl)
    )
);
