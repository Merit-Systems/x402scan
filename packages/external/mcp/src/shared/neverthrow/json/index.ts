import { resultFromThrowable } from '@x402scan/neverthrow';
import type { JsonObject } from './types';

const type = 'json';

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
