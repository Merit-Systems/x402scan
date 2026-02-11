import type { z } from 'zod';

import { errorResponse, outputAndExit, type OutputFlags } from '@/cli/output';
import { requestSchema } from '@/server/tools/lib/request';
import { safeParseJson } from '@/shared/neverthrow/json';

import type { GlobalFlags } from '@/types';

interface RawRequestArgs {
  url: string;
  method?: string;
  body?: string;
  headers?: string;
}

type RequestInput = z.infer<typeof requestSchema>;

/**
 * Parse and validate CLI request arguments into a typed RequestInput.
 * Exits with error response if parsing fails.
 */
export function parseRequestInput(
  surface: string,
  args: RawRequestArgs,
  flags: GlobalFlags<OutputFlags>
): RequestInput {
  // Parse body JSON if provided
  let parsedBody: unknown;
  if (args.body) {
    const bodyResult = safeParseJson(surface, args.body);
    if (bodyResult.isErr()) {
      outputAndExit(
        errorResponse({
          code: 'INVALID_INPUT',
          message: `Invalid JSON body: ${args.body}`,
          surface,
          cause: 'invalid_json',
        }),
        flags
      );
    }
    parsedBody = bodyResult.value;
  }

  // Parse headers JSON if provided
  let parsedHeaders: Record<string, string> | undefined;
  if (args.headers) {
    const headersResult = safeParseJson(surface, args.headers);
    if (headersResult.isErr()) {
      outputAndExit(
        errorResponse({
          code: 'INVALID_INPUT',
          message: `Invalid JSON headers: ${args.headers}`,
          surface,
          cause: 'invalid_json',
        }),
        flags
      );
    }

    // Validate headers is an object with string values
    const headersValue = headersResult.value;
    if (
      typeof headersValue !== 'object' ||
      headersValue === null ||
      Array.isArray(headersValue)
    ) {
      outputAndExit(
        errorResponse({
          code: 'INVALID_INPUT',
          message: 'Headers must be an object',
          surface,
          cause: 'invalid_headers',
        }),
        flags
      );
    }

    // Validate all values are strings
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(headersValue)) {
      if (typeof value !== 'string') {
        outputAndExit(
          errorResponse({
            code: 'INVALID_INPUT',
            message: `Header "${key}" must be a string, got ${typeof value}`,
            surface,
            cause: 'invalid_headers',
          }),
          flags
        );
      }
      headers[key] = value;
    }
    parsedHeaders = headers;
  }

  // Validate full request input
  const inputResult = requestSchema.safeParse({
    url: args.url,
    method: args.method ?? 'GET',
    body: parsedBody,
    headers: parsedHeaders ?? {},
  });

  if (!inputResult.success) {
    outputAndExit(
      errorResponse({
        code: 'INVALID_INPUT',
        message: inputResult.error.message,
        surface,
        cause: 'validation',
      }),
      flags
    );
  }

  return inputResult.data;
}
