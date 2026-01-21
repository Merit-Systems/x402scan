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

export type FileSystemError<Surface extends string> = Error<
  FileSystemErrorType,
  Surface
>;

export type FileSystemResult<T, Surface extends string> = Result<
  T,
  FileSystemErrorType,
  Surface
>;

export type FileSystemResultAsync<T, Surface extends string> = ResultAsync<
  T,
  FileSystemErrorType,
  Surface
>;
