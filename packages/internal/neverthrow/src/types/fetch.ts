import type { BaseError, Error as ErrorType, ResultAsync } from './base';

export type FetchErrorType = 'network' | 'http' | 'parse';

export type FetchExtra =
  | {
      type: 'network';
      error: Error;
    }
  | {
      type: 'http';
      status: number;
      response: Response;
    }
  | {
      type: 'parse';
      error: Error;
    };

export type BaseFetchError = BaseError<FetchErrorType> & FetchExtra;

export type FetchError<Surface extends string> = ErrorType<
  FetchErrorType,
  Surface
> &
  FetchExtra;

export type FetchResultAsync<Surface extends string, T> = ResultAsync<
  T,
  FetchErrorType,
  Surface,
  FetchError<Surface>
>;
