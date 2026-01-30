import { err, ok, resultFromPromise } from '@x402scan/neverthrow';

import type z from 'zod';

import type { BaseError, Error } from '@x402scan/neverthrow/types';
import type { BaseFetchError, FetchError, ParsedResponse } from './types';
import type { JsonObject } from '../json/types';
import { safeParse } from '../parse';

const errorType = 'fetch';

export const fetchErr = (surface: string, error: BaseFetchError) =>
  err(errorType, surface, error);
export const fetchOk = <T>(value: T) => ok(value);

export const fetchHttpErr = (surface: string, response: Response) =>
  fetchErr(surface, {
    cause: 'http' as const,
    statusCode: response.status,
    message: response.statusText,
    response,
  });

export const safeFetch = (surface: string, request: Request) => {
  return resultFromPromise(
    errorType,
    surface,
    fetch(request),
    error =>
      ({
        cause: 'network',
        message: error instanceof Error ? error.message : 'Network error',
      }) as BaseFetchError
  );
};

export const safeFetchJson = <T>(
  surface: string,
  request: Request,
  schema: z.ZodSchema<T>
) => {
  return safeFetch(surface, request)
    .andThen(response => {
      if (!response.ok) {
        return fetchHttpErr(surface, response);
      }

      return resultFromPromise(errorType, surface, response.json(), () => ({
        cause: 'parse' as const,
        message: 'Could not parse JSON from response',
        statusCode: response.status,
        contentType: response.headers.get('content-type') ?? 'Not specified',
      }));
    })
    .andThen(data => safeParse(surface, schema, data));
};

export const safeParseResponse = (surface: string, response: Response) => {
  return resultFromPromise(
    errorType,
    surface,
    (async (): Promise<ParsedResponse> => {
      const contentType = response.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        return {
          type: 'json' as const,
          data: (await response.json()) as JsonObject,
        };
      } else if (
        contentType.includes('image/png') ||
        contentType.includes('image/jpeg') ||
        contentType.includes('image/gif') ||
        contentType.includes('image/webp') ||
        contentType.includes('image/svg+xml') ||
        contentType.includes('image/tiff') ||
        contentType.includes('image/bmp') ||
        contentType.includes('image/ico')
      ) {
        return {
          type: 'image' as const,
          mimeType: contentType,
          data: await response.arrayBuffer(),
        };
      } else if (contentType.includes('audio/')) {
        return {
          type: 'audio' as const,
          mimeType: contentType,
          data: await response.arrayBuffer(),
        };
      } else if (contentType.includes('video/')) {
        return {
          type: 'video' as const,
          mimeType: contentType,
          data: await response.arrayBuffer(),
        };
      } else if (contentType.includes('application/pdf')) {
        return {
          type: 'pdf' as const,
          mimeType: contentType,
          data: await response.arrayBuffer(),
        };
      } else if (contentType.includes('application/octet-stream')) {
        return {
          type: 'octet-stream' as const,
          mimeType: contentType,
          data: await response.arrayBuffer(),
        };
      } else if (contentType.includes('multipart/form-data')) {
        return { type: 'formData' as const, data: await response.formData() };
      } else if (contentType.includes('text/')) {
        return { type: 'text' as const, data: await response.text() };
      } else {
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
