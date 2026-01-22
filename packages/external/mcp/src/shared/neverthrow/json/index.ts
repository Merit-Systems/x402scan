import { resultFromThrowable } from '@x402scan/neverthrow';
import type { JsonValue } from './types';

const type = 'json';

export const safeParseJson = <T>(surface: string, text: string) => {
  return resultFromThrowable(
    type,
    surface,
    () => JSON.parse(text) as T,
    () => ({
      cause: 'parse' as const,
      message: 'Could not parse JSON from text',
    })
  );
};

export const safeStringifyJson = (surface: string, value: JsonValue) => {
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
