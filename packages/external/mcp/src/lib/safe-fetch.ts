import { err, ResultAsync } from 'neverthrow';

import type { Error } from './error';

type FetchError = NetworkError | HttpError | ParseError;

type NetworkError = Error<{
  type: 'network';
  error: Error;
}>;

type HttpError<E = unknown> = Error<{
  type: 'http';
  status: number;
  headers: Headers;
  json: E;
}>;

type ParseError = Error<{
  type: 'parse';
  error: Error;
}>;

function safeFetch(
  input: URL | string,
  init?: RequestInit
): ResultAsync<Response, FetchError> {
  return ResultAsync.fromPromise(
    fetch(input, init),
    (error): NetworkError => ({
      type: 'network' as const,
      message: 'Network error',
      error: error instanceof Error ? error : new Error(String(error)),
    })
  );
}

export const safeFetchJson = <T, E = unknown>(
  input: URL | string,
  init?: RequestInit,
  errorMessage?: (e: E) => string
): ResultAsync<T, FetchError> => {
  return safeFetch(input, init).andThen(response => {
    if (!response.ok) {
      return ResultAsync.fromSafePromise(
        response.json().catch(() => undefined)
      ).andThen(json =>
        err({
          type: 'http' as const,
          message: errorMessage?.(json as E) ?? response.statusText,
          status: response.status,
          headers: response.headers,
          json: json as E,
        })
      );
    }

    return ResultAsync.fromPromise(
      response.json() as Promise<T>,
      (error): ParseError => ({
        type: 'parse' as const,
        message: 'Could not parse JSON from response',
        error: error instanceof Error ? error : new Error(String(error)),
      })
    );
  });
};
