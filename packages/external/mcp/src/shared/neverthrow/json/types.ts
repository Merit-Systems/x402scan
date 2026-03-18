import type { BaseError } from '@x402scan/neverthrow/types';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

type JsonArray = JsonValue[];

type JsonErrorCause = 'stringify' | 'parse';

export type BaseJsonError = BaseError<JsonErrorCause>;
