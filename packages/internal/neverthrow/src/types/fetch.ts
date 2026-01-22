import type { safeFetch } from '../fetch';
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
      statusCode: number;
      contentType: string;
    };

export type BaseFetchError = BaseError<FetchErrorType> & FetchExtra;

export type FetchError = ErrorType<FetchErrorType> & FetchExtra;

export type FetchResultAsync<T> = ResultAsync<T, FetchErrorType, FetchError>;

export type SafeFetchResult = ReturnType<typeof safeFetch>;

export type ParsedResponseType =
  | 'json'
  | 'arrayBuffer'
  | 'blob'
  | 'formData'
  | 'text';

export type ParsedResponse =
  | { type: 'json'; data: unknown }
  | { type: 'arrayBuffer'; data: ArrayBuffer }
  | { type: 'blob'; data: Blob }
  | { type: 'formData'; data: FormData }
  | { type: 'text'; data: string };
