import type { registryRegisterBodySchema } from '@/app/api/x402/_lib/schemas';
import { jsonResponse } from '@/app/api/x402/_lib/utils';
import { registerResourceUrl } from '@/lib/registry/register-resource-url';

import type { z } from 'zod';

export async function handleRegistryRegister(
  body: z.infer<typeof registryRegisterBodySchema>
) {
  const { url } = body;

  const result = await registerResourceUrl(url);

  if (!result.success) {
    switch (result.error.type) {
      case 'unsupportedUrl':
        return jsonResponse(
          {
            success: false,
            error: { type: 'unsupported_url', message: result.error.message },
          },
          422
        );
      case 'no402':
        return jsonResponse(
          {
            success: false,
            error: { type: 'no_402', message: result.error.message },
          },
          422
        );
      case 'parseErrors':
        return jsonResponse(
          {
            success: false,
            error: {
              type: 'parse_error',
              parseErrors: result.error.parseErrors,
            },
            data: result.data,
          },
          422
        );
      default: {
        const _exhaustive: never = result.error;
        return _exhaustive;
      }
    }
  }

  return jsonResponse(
    JSON.parse(
      JSON.stringify(
        {
          success: true,
          resource: result.resource,
          accepts: result.accepts,
          registrationDetails: result.registrationDetails,
          methodUsed: result.methodUsed,
          discovery: result.discovery,
        },
        (_k, v: unknown) => (typeof v === 'bigint' ? Number(v) : v)
      )
    )
  );
}
