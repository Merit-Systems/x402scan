import type { registryRegisterBodySchema } from '@/app/api/x402/_lib/schemas';
import { jsonResponse } from '@/app/api/x402/_lib/utils';
import { registerResource } from '@/lib/resources';

import { checkEndpointSchema } from '@agentcash/discovery';
import { PROBE_TIMEOUT_MS } from '@/lib/discovery/utils';
import type { z } from 'zod';

export async function handleRegistryRegister(
  body: z.infer<typeof registryRegisterBodySchema>
) {
  const { url } = body;

  const check = await checkEndpointSchema({
    url: url.replace('{', '').replace('}', ''),
    sampleInputBody: {},
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
  });

  if (!check.found) {
    return jsonResponse(
      {
        success: false,
        error: {
          type: 'no_402',
          message: 'Endpoint not found or not reachable',
        },
      },
      422
    );
  }

  let lastParseError: {
    parseErrors: string[];
    data: unknown;
    issues?: unknown[];
  } | null = null;

  for (const advisory of check.advisories) {
    if (!advisory.paymentOptions?.some(p => p.protocol === 'x402')) continue;

    const result = await registerResource(url, advisory);

    if (!result.success) {
      lastParseError = {
        data: result.data,
        parseErrors:
          result.error.type === 'parseResponse'
            ? result.error.parseErrors
            : [JSON.stringify(result.error)],
        issues: 'issues' in result.error ? result.error.issues : undefined,
      };
      continue;
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

  if (lastParseError) {
    return jsonResponse(
      {
        success: false,
        error: {
          type: 'parse_error',
          parseErrors: lastParseError.parseErrors,
          issues: lastParseError.issues,
        },
        data: lastParseError.data,
      },
      422
    );
  }

  return jsonResponse(
    {
      success: false,
      error: {
        type: 'no_402',
        message: 'Resource did not return a 402 Payment Required response',
      },
    },
    422
  );
}
