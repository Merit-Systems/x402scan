import { errAsync, resultFromPromise, resultFromSafePromise } from '.';

import type { BaseFetchError, FetchErrorType } from './types/fetch';

export const safeFetch = <Surface extends string>(
  surface: Surface,
  input: URL | string,
  init?: RequestInit
) => {
  return resultFromPromise<FetchErrorType, Surface, BaseFetchError>(surface)(
    fetch(input, init),
    error => ({
      type: 'network' as const,
      message: 'Network error',
      error: error instanceof Error ? error : new Error(String(error)),
    })
  );
};

export const safeFetchJson = <Surface extends string, T, E = unknown>(
  surface: Surface,
  input: URL | string,
  init?: RequestInit,
  errorMessage?: (e: E) => string
) => {
  return safeFetch(surface, input, init).andThen(response => {
    if (!response.ok) {
      return resultFromSafePromise(surface)(
        response.json().catch(() => undefined) as Promise<E | undefined>
      ).andThen(json =>
        errAsync(surface)({
          type: 'http' as const,
          message:
            json !== undefined && errorMessage
              ? errorMessage(json)
              : response.statusText,
          status: response.status,
          headers: response.headers,
          json,
        })
      );
    }

    return resultFromPromise<FetchErrorType, Surface, BaseFetchError>(surface)(
      response.json() as Promise<T>,
      error => ({
        type: 'parse' as const,
        message: 'Could not parse JSON from response',
        error: error instanceof Error ? error : new Error(String(error)),
      })
    );
  });
};
