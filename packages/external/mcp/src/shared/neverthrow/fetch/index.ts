import { err, resultFromPromise } from '@x402scan/neverthrow';

import type { BaseFetchError, ParsedResponse } from './types';

const errorType = 'fetch';

const fetchErr = (surface: string, error: BaseFetchError) =>
  err(errorType, surface, error);

export const safeFetch = (surface: string, request: Request) => {
  return resultFromPromise(
    errorType,
    surface,
    fetch(request),
    error =>
      ({
        cause: 'network' as const,
        message: 'Network error',
        error: error instanceof Error ? error : new Error(String(error)),
      }) as BaseFetchError
  );
};

export const safeFetchJson = <T>(surface: string, request: Request) => {
  return safeFetch(surface, request).andThen(response => {
    if (!response.ok) {
      return fetchErr(surface, {
        cause: 'http' as const,
        message: 'HTTP error',
        status: response.status,
        response,
      });
    }

    return resultFromPromise(
      errorType,
      surface,
      response.json() as Promise<T>,
      () => ({
        cause: 'parse' as const,
        message: 'Could not parse JSON from response',
        statusCode: response.status,
        contentType: response.headers.get('content-type') ?? 'Not specified',
      })
    );
  });
};

export const safeParseResponse = (surface: string, response: Response) => {
  return resultFromPromise(
    errorType,
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
    () =>
      ({
        cause: 'parse' as const,
        message: 'Could not parse response',
        statusCode: response.status,
        contentType: response.headers.get('content-type') ?? 'Not specified',
      }) as BaseFetchError
  );
};
