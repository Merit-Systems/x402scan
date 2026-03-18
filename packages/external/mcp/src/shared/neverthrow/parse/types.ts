import type { BaseError } from '@x402scan/neverthrow/types';
import type z from 'zod';

type ParseErrorType = 'invalid_data';

export type BaseParseError = BaseError<ParseErrorType> & { error: z.ZodError };
