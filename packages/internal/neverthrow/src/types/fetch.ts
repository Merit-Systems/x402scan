import type { BaseError, Error as ErrorType, ResultAsync } from './base';

export type FetchErrorType = 'network' | 'http' | 'parse';

export type FetchExtra<E = unknown> =
  | {
      type: 'network';
      error: Error;
    }
  | {
      type: 'http';
      status: number;
      headers: Headers;
      json: E | undefined;
    }
  | {
      type: 'parse';
      error: Error;
    };

export type BaseFetchError<E = unknown> = BaseError<FetchErrorType> &
  FetchExtra<E>;

export type FetchError<Surface extends string, E = unknown> = ErrorType<
  FetchErrorType,
  Surface
> &
  FetchExtra<E>;

export type FetchResultAsync<
  Surface extends string,
  T,
  E = unknown,
> = ResultAsync<T, FetchErrorType, Surface, FetchError<Surface, E>>;
