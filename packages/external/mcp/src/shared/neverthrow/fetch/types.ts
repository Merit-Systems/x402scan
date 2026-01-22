import type { BaseError } from '@x402scan/neverthrow/types';

type FetchErrorType = 'network' | 'http' | 'parse';

type FetchExtra =
  | {
      type: 'network';
    }
  | {
      type: 'http';
      status: number;
      response: Response;
    }
  | {
      type: 'parse';
      statusCode: number;
      contentType: string;
    };

export type BaseFetchError = BaseError<FetchErrorType> & FetchExtra;

export type ParsedResponse =
  | { type: 'json'; data: unknown }
  | { type: 'arrayBuffer'; data: ArrayBuffer }
  | { type: 'blob'; data: Blob }
  | { type: 'formData'; data: FormData }
  | { type: 'text'; data: string };
