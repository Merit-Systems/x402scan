import type { BaseError } from '@x402scan/neverthrow/types';

type FileSystemErrorType =
  | 'file_not_found'
  | 'file_not_readable'
  | 'file_not_writable'
  | 'file_not_chmodable'
  | 'file_not_deletable'
  | 'file_not_renamable'
  | 'file_not_copyable'
  | 'file_not_movable'
  | 'file_doesnt_exist';

export type BaseFileSystemError = BaseError<FileSystemErrorType>;
