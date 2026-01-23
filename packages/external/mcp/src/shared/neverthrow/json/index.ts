import { err, resultFromThrowable } from '@x402scan/neverthrow';

import type { BaseJsonError, JsonObject } from './types';

const type = 'json';

export const jsonErr = (surface: string, error: BaseJsonError) => {
  return err(type, surface, error);
};

export const safeStringifyJson = (surface: string, value: JsonObject) => {
  return resultFromThrowable(
    type,
    surface,
    () => JSON.stringify(value),
    () => ({
      cause: 'stringify' as const,
      message: 'Could not stringify JSON',
    })
  );
};

export const safeParseJson = (surface: string, value: string) => {
  return resultFromThrowable(
    type,
    surface,
    () => JSON.parse(value) as JsonObject,
    e => ({
      cause: 'parse' as const,
      message: e instanceof Error ? e.message : 'Could not parse JSON',
    })
  );
};
