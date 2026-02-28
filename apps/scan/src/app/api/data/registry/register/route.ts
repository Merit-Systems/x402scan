import type { NextRequest } from 'next/server';

import { registryRegisterBodySchema } from '@/app/api/data/_lib/schemas';
import { parseJsonBody, jsonResponse } from '@/app/api/data/_lib/utils';
import { registerResource } from '@/lib/resources';
import { extractX402Data } from '@/lib/x402';
import { Methods } from '@/types/x402';

const PROBE_TIMEOUT_MS = 15000;

export const POST = async (request: NextRequest) => {
  const parsed = await parseJsonBody(request, registryRegisterBodySchema);
  if (!parsed.success) return parsed.response;

  const { url } = parsed.data;

  let lastParseError: {
    parseErrors: string[];
    data: unknown;
  } | null = null;

  for (const method of [Methods.POST, Methods.GET]) {
    let response: Response;
    try {
      response = await fetch(url.replace('{', '').replace('}', ''), {
        method,
        headers:
          method === Methods.POST
            ? {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
              }
            : { 'Cache-Control': 'no-cache' },
        body: method === Methods.POST ? '{}' : undefined,
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        cache: 'no-store',
      });
    } catch {
      continue;
    }

    if (response.status !== 402) {
      continue;
    }

    const x402Data = await extractX402Data(response);
    const result = await registerResource(url, x402Data);

    if (!result.success) {
      if (result.error.type === 'parseResponse') {
        lastParseError = {
          data: result.data,
          parseErrors: result.error.parseErrors,
        };
        continue;
      }
      lastParseError = {
        data: result.data ?? null,
        parseErrors:
          'parseErrors' in result.error &&
          Array.isArray(result.error.parseErrors)
            ? result.error.parseErrors
            : [JSON.stringify(result.error)],
      };
      continue;
    }

    return jsonResponse({
      success: true,
      resource: result.resource,
      accepts: result.accepts,
      registrationDetails: result.registrationDetails,
    });
  }

  if (lastParseError) {
    return jsonResponse(
      {
        success: false,
        error: { type: 'parse_error', parseErrors: lastParseError.parseErrors },
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
};
