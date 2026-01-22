import { err, resultFromPromise } from '@x402scan/neverthrow';

import type { BaseFetchError, ParsedResponse } from './types';

// No generics needed - inferred from error parameter
export const fetchErr = (surface: string, error: BaseFetchError) =>
  err(surface, error);

// Only specify T when needed, BE inferred from callback
export const safeFetch = (surface: string, request: Request) => {
  return resultFromPromise(
    surface,
    fetch(request),
    error =>
      ({
        type: 'network' as const,
        message: 'Network error',
        error: error instanceof Error ? error : new Error(String(error)),
      }) as BaseFetchError
  );
};

export const safeFetchJson = <T>(surface: string, request: Request) => {
  return safeFetch(surface, request).andThen(response => {
    if (!response.ok) {
      return fetchErr(surface, {
        type: 'http' as const,
        message: 'HTTP error',
        status: response.status,
        response,
      });
    }

    return resultFromPromise(
      surface,
      response.json() as Promise<T>,
      error =>
        ({
          type: 'parse' as const,
          message: 'Could not parse JSON from response',
          error: error instanceof Error ? error : new Error(String(error)),
          statusCode: response.status,
          contentType: response.headers.get('content-type') ?? 'Not specified',
        }) as BaseFetchError
    );
  });
};

export const safeParseResponse = (surface: string, response: Response) => {
  return resultFromPromise(
    surface,
    (async (): Promise<ParsedResponse> => {
      const contentType = response.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        return { type: 'json', data: (await response.json()) as unknown };
      }

      if (
        contentType.includes('image/') ||
        contentType.includes('audio/') ||
        contentType.includes('video/') ||
        contentType.includes('application/octet-stream') ||
        contentType.includes('application/pdf')
      ) {
        return { type: 'arrayBuffer', data: await response.arrayBuffer() };
      }

      if (contentType.includes('multipart/form-data')) {
        return { type: 'formData', data: await response.formData() };
      }

      return { type: 'text', data: await response.text() };
    })(),
    error =>
      ({
        type: 'parse' as const,
        message: 'Could not parse response',
        error: error instanceof Error ? error : new Error(String(error)),
        statusCode: response.status,
        contentType: response.headers.get('content-type') ?? 'Not specified',
      }) as BaseFetchError
  );
};
