import type { BaseError, Result, ResultAsync, Error } from './base';

export type FileSystemErrorType =
  | 'file_not_found'
  | 'file_not_readable'
  | 'file_not_writable'
  | 'file_not_chmodable'
  | 'file_not_deletable'
  | 'file_not_renamable'
  | 'file_not_copyable'
  | 'file_not_movable';

export type BaseFileSystemError = BaseError<FileSystemErrorType>;

export type FileSystemError = Error<FileSystemErrorType>;

export type FileSystemResult<T> = Result<T, FileSystemErrorType>;

export type FileSystemResultAsync<T> = ResultAsync<T, FileSystemErrorType>;
