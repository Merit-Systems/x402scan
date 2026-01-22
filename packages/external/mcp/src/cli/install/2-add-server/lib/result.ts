import { ok } from '@x402scan/neverthrow';
import type { BaseError } from '@x402scan/neverthrow/types';

export const surface = 'config_file';

type ConfigErrorType = 'parse_config' | 'serialize_config';

type ConfigError = BaseError<ConfigErrorType>;

export const configOk = <T>(data: T) => ok<ConfigErrorType, T>(surface, data);
