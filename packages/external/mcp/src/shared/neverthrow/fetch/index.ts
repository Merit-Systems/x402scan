import { err, resultFromPromise } from '@x402scan/neverthrow';

import type { BaseError, Error } from '@x402scan/neverthrow/types';
import type { BaseFetchError, FetchError, ParsedResponse } from './types';
import type { JsonObject } from '../json/types';

const errorType = 'fetch';

export const fetchErr = (surface: string, error: BaseFetchError) =>
  err(errorType, surface, error);

export const safeFetch = (surface: string, request: Request) => {
  return resultFromPromise(
    errorType,
    surface,
    fetch(request),
    error =>
      ({
        cause: 'network' as const,
        message: error instanceof Error ? error.message : 'Network error',
      }) as BaseFetchError
  );
};

export const safeFetchJson = <T>(surface: string, request: Request) => {
  return safeFetch(surface, request).andThen(response => {
    if (!response.ok) {
      return fetchErr(surface, {
        cause: 'http' as const,
        message: 'HTTP error',
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

      switch (contentType) {
        case 'application/json':
          return {
            type: 'json' as const,
            data: (await response.json()) as JsonObject,
          };
        case 'image/':
          return {
            type: 'image' as const,
            mimeType: contentType,
            data: await response.arrayBuffer(),
          };
        case 'audio/':
          return {
            type: 'audio' as const,
            mimeType: contentType,
            data: await response.arrayBuffer(),
          };
        case 'video/':
          return {
            type: 'video' as const,
            mimeType: contentType,
            data: await response.arrayBuffer(),
          };
        case 'application/pdf':
          return {
            type: 'pdf' as const,
            mimeType: contentType,
            data: await response.arrayBuffer(),
          };
        case 'application/octet-stream':
          return {
            type: 'octet-stream' as const,
            mimeType: contentType,
            data: await response.arrayBuffer(),
          };
        case 'multipart/form-data':
          return { type: 'formData' as const, data: await response.formData() };
        case 'text/':
          return { type: 'text' as const, data: await response.text() };
        default:
          throw new Error(`Unsupported content type: ${contentType}`);
      }
    })(),
    e => ({
      cause: 'parse' as const,
      message: e instanceof Error ? e.message : 'Could not parse response',
      statusCode: response.status,
      contentType: response.headers.get('content-type') ?? 'Not specified',
    })
  );
};

export const isFetchError = (error: Error<BaseError>): error is FetchError => {
  return error.type === errorType;
};
