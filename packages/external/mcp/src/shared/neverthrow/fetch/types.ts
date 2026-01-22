import type { BaseError } from '@x402scan/neverthrow/types';

type FetchErrorCause = 'network' | 'http' | 'parse';

type FetchExtra =
  | {
      cause: 'network';
    }
  | {
      cause: 'http';
      status: number;
      response: Response;
    }
  | {
      cause: 'parse';
      statusCode: number;
      contentType: string;
    };

export type BaseFetchError = BaseError<FetchErrorCause> & FetchExtra;

export type ParsedResponse =
  | { type: 'json'; data: unknown }
  | { type: 'arrayBuffer'; data: ArrayBuffer }
  | { type: 'blob'; data: Blob }
  | { type: 'formData'; data: FormData }
  | { type: 'text'; data: string };
