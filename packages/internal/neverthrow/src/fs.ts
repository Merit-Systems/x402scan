import * as fs from 'fs/promises';

import { err, ok, resultFromPromise } from '.';

import type { BaseFileSystemError, FileSystemErrorType } from './types/fs';

export const fsResultFromPromise = <Surface extends string, T>(
  surface: Surface,
  promise: Promise<T>,
  error: (e: unknown) => BaseFileSystemError
) =>
  resultFromPromise<FileSystemErrorType, Surface, BaseFileSystemError, T>(
    surface,
    promise,
    error
  );

export const fsOk =
  <Surface extends string, T>(surface: Surface) =>
  (data: T) =>
    ok(surface, data);

export const fsErr =
  <Surface extends string>(surface: Surface) =>
  (error: BaseFileSystemError) =>
    err<FileSystemErrorType, Surface, BaseFileSystemError>(surface, error);

export const safeReadFile = <Surface extends string>(
  surface: Surface,
  path: string
) =>
  fsResultFromPromise(surface, fs.readFile(path, 'utf-8'), error => ({
    type: 'file_not_readable',
    message: 'Failed to read file',
    error,
  }));

export const safeWriteFile = <Surface extends string>(
  surface: Surface,
  path: string,
  data: string
) =>
  fsResultFromPromise(surface, fs.writeFile(path, data), error => ({
    type: 'file_not_writable',
    message: 'Failed to write file',
    error,
  }));

export const safeAppendFile = <Surface extends string>(
  surface: Surface,
  path: string,
  data: string
) =>
  fsResultFromPromise(surface, fs.appendFile(path, data), error => ({
    type: 'file_not_writable',
    message: 'Failed to append file',
    error,
  }));

export const safeChmod = <Surface extends string>(
  surface: Surface,
  path: string,
  mode: number
) =>
  fsResultFromPromise(surface, fs.chmod(path, mode), error => ({
    type: 'file_not_chmodable',
    message: 'Failed to chmod file',
    error,
  }));
