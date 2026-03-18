import type { BaseError, Error } from '@x402scan/neverthrow/types';
import type { JsonObject } from '../json/types';

type FetchErrorCause = 'network' | 'http' | 'parse';

type FetchExtra =
  | {
      cause: 'network';
    }
  | {
      cause: 'http';
      statusCode: number;
      response: Response;
    }
  | {
      cause: 'parse';
      statusCode: number;
      contentType: string;
    };

export type BaseFetchError = BaseError<FetchErrorCause> & FetchExtra;
export type FetchError = Error<BaseFetchError>;

export type ParsedResponse =
  | { type: 'json'; data: JsonObject }
  | { type: 'image'; mimeType: string; data: ArrayBuffer }
  | { type: 'audio'; mimeType: string; data: ArrayBuffer }
  | { type: 'video'; mimeType: string; data: ArrayBuffer }
  | { type: 'pdf'; mimeType: string; data: ArrayBuffer }
  | { type: 'octet-stream'; mimeType: string; data: ArrayBuffer }
  | { type: 'formData'; data: FormData }
  | { type: 'text'; data: string };
