import { resultFromThrowable } from '@x402scan/neverthrow';

import type { BaseConfigError, ConfigErrorType } from '../types';

const surface = 'config_file';

export const configResultFromThrowable = <T>(
  fn: () => T,
  error: (e: unknown) => BaseConfigError
) =>
  resultFromThrowable<ConfigErrorType, BaseConfigError, T>(surface, fn, error);
