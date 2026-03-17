import type { registryRegisterBodySchema } from '@/app/api/x402/_lib/schemas';
import { jsonResponse } from '@/app/api/x402/_lib/utils';
import { registerResource, toX402PaymentOptions } from '@/lib/resources';

import { checkEndpointSchema } from '@agentcash/discovery';
import type { z } from 'zod';

const PROBE_TIMEOUT_MS = 15000;

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
        error: { type: 'no_402', message: 'Endpoint not found or not reachable' },
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
    const x402Options = toX402PaymentOptions(advisory.paymentOptions ?? []);
    if (x402Options.length === 0) continue;

    const result = await registerResource(url, {
      paymentOptions: x402Options,
      inputSchema: advisory.inputSchema,
      outputSchema: advisory.outputSchema,
      paymentRequiredBody: advisory.paymentRequiredBody,
    });

    if (!result.success) {
      lastParseError = {
        data: result.data,
        parseErrors:
          result.error.type === 'parseResponse'
            ? result.error.parseErrors
            : [JSON.stringify(result.error)],
        issues:
          'issues' in result.error ? result.error.issues : undefined,
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
