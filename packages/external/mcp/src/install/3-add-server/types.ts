import type { FileFormat } from './file-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClientConfigObject = Record<string, any>;

export interface ClientConfigFile {
  path: string;
  configKey: string;
  format: FileFormat;
}
