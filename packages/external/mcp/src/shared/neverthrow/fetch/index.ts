import contentType from 'content-type';
import { err, ok, resultFromPromise } from '@x402scan/neverthrow';

import type z from 'zod';

import type { BaseError, Error } from '@x402scan/neverthrow/types';
import type { BaseFetchError, FetchError, ParsedResponse } from './types';
import type { JsonObject } from '../json/types';
import { safeParse } from '../parse';

const IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/tiff',
  'image/bmp',
  'image/ico',
]);

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
      const header = response.headers.get('content-type');
      const { type: mimeType } = header
        ? contentType.parse(header)
        : { type: 'application/octet-stream' };

      switch (mimeType) {
        case 'application/json':
          return {
            type: 'json' as const,
            data: (await response.json()) as JsonObject,
          };
        case 'application/pdf':
          return {
            type: 'pdf' as const,
            mimeType,
            data: await response.arrayBuffer(),
          };
        case 'application/octet-stream':
          return {
            type: 'octet-stream' as const,
            mimeType,
            data: await response.arrayBuffer(),
          };
        case 'multipart/form-data':
          return { type: 'formData' as const, data: await response.formData() };
      }

      if (IMAGE_TYPES.has(mimeType)) {
        return {
          type: 'image' as const,
          mimeType,
          data: await response.arrayBuffer(),
        };
      }

      if (mimeType.startsWith('audio/')) {
        return {
          type: 'audio' as const,
          mimeType,
          data: await response.arrayBuffer(),
        };
      }

      if (mimeType.startsWith('video/')) {
        return {
          type: 'video' as const,
          mimeType,
          data: await response.arrayBuffer(),
        };
      }

      if (mimeType.startsWith('text/')) {
        return { type: 'text' as const, data: await response.text() };
      }

      throw new Error(`Unsupported content type: ${header}`);
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
