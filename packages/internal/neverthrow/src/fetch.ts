import { err, resultFromPromise } from '.';

import type { BaseFetchError, FetchErrorType } from './types/fetch';

export const fetchErr = <Surface extends string>(
  surface: Surface,
  error: BaseFetchError
) => err<FetchErrorType, Surface, BaseFetchError>(surface, error);

export const safeFetch = <Surface extends string>(
  surface: Surface,
  input: URL | string,
  init?: RequestInit
) => {
  return resultFromPromise<FetchErrorType, Surface, BaseFetchError, Response>(
    surface,
    fetch(input, init),
    error => ({
      type: 'network' as const,
      message: 'Network error',
      error: error instanceof Error ? error : new Error(String(error)),
    })
  );
};

export const safeFetchJson = <Surface extends string, T>(
  surface: Surface,
  input: URL | string,
  init?: RequestInit
) => {
  return safeFetch<Surface>(surface, input, init).andThen(response => {
    if (!response.ok) {
      return fetchErr(surface, {
        type: 'http' as const,
        message: 'HTTP error',
        status: response.status,
        response,
      });
    }

    return resultFromPromise<FetchErrorType, Surface, BaseFetchError, T>(
      surface,
      response.json() as Promise<T>,
      error => ({
        type: 'parse' as const,
        message: 'Could not parse JSON from response',
        error: error instanceof Error ? error : new Error(String(error)),
      })
    );
  });
};
