import type { FileFormat } from './lib/file-types';
import type { BaseError } from '@x402scan/neverthrow/types';

export type ClientConfigObject = Record<string, any>;

export interface ClientConfigFile {
  path: string;
  configKey: string;
  format: FileFormat;
}

type ConfigErrorType = 'parse_config' | 'serialize_config';

export type BaseConfigError = BaseError<ConfigErrorType>;
