import z from 'zod';

import { err, ok } from '@x402scan/neverthrow';

import type { BaseParseError } from './types';
import type { BaseError, Error } from '@x402scan/neverthrow/types';

const type = 'json';

const parseErr = (surface: string, error: BaseParseError) =>
  err(type, surface, error);

export const safeParse = <T>(
  surface: string,
  schema: z.ZodSchema<T>,
  value: unknown
) => {
  const parseResult = schema.safeParse(value);
  if (!parseResult.success) {
    return parseErr(surface, {
      cause: 'invalid_data',
      message: JSON.stringify(z.treeifyError(parseResult.error), null, 2),
      error: parseResult.error,
    });
  }
  return ok(parseResult.data);
};

export const isParseError = (
  error: Error<BaseError>
): error is Error<BaseParseError> => {
  return error.type === type;
};
