import type { registryRegisterBodySchema } from '@/app/api/x402/_lib/schemas';
import { jsonResponse } from '@/app/api/x402/_lib/utils';
import { registerResource } from '@/lib/resources';

import { probeX402Endpoint } from '@/lib/discovery/probe';
import type { z } from 'zod';

export async function handleRegistryRegister(
  body: z.infer<typeof registryRegisterBodySchema>
) {
  const { url } = body;

  const probeResult = await probeX402Endpoint(
    url.replaceAll('{', '').replaceAll('}', '')
  );

  if (!probeResult.success) {
    return jsonResponse(
      {
        success: false,
        error: { type: 'no_402', message: probeResult.error },
      },
      422
    );
  }

  const result = await registerResource(url, probeResult.advisory);

  if (!result.success) {
    return jsonResponse(
      {
        success: false,
        error: {
          type: 'parse_error',
          parseErrors:
            result.error.type === 'parseResponse'
              ? result.error.parseErrors
              : [JSON.stringify(result.error)],
        },
        data: result.data,
      },
      422
    );
  }

  return jsonResponse(
    JSON.parse(
      JSON.stringify(
        {
          success: true,
          resource: result.resource,
          accepts: result.accepts,
          registrationDetails: result.registrationDetails,
        },
        (_k, v: unknown) => (typeof v === 'bigint' ? Number(v) : v)
      )
    )
  );
}
