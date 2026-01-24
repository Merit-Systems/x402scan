import * as fs from 'fs/promises';
import { existsSync } from 'fs';

import { err, ok, resultFromPromise } from '@x402scan/neverthrow';

import type { BaseFileSystemError } from './types';

const errorType = 'fs';

export const fsErr = (surface: string, error: BaseFileSystemError) =>
  err(errorType, surface, error);

const fsResultFromPromise = <T>(
  surface: string,
  promise: Promise<T>,
  error: (e: unknown) => BaseFileSystemError
) => resultFromPromise(errorType, surface, promise, error);

export const safeReadFile = (surface: string, path: string) =>
  fsResultFromPromise(surface, fs.readFile(path, 'utf-8'), () => ({
    cause: 'file_not_readable',
    message: 'Failed to read file',
  }));

export const safeWriteFile = (surface: string, path: string, data: string) =>
  fsResultFromPromise(surface, fs.writeFile(path, data), () => ({
    cause: 'file_not_writable',
    message: 'Failed to write file',
  }));

export const safeAppendFile = (surface: string, path: string, data: string) =>
  fsResultFromPromise(surface, fs.appendFile(path, data), () => ({
    cause: 'file_not_writable',
    message: 'Failed to append file',
  }));

export const safeChmod = (surface: string, path: string, mode: number) =>
  fsResultFromPromise(surface, fs.chmod(path, mode), () => ({
    cause: 'file_not_chmodable',
    message: 'Failed to chmod file',
  }));

export const safeFileExists = (surface: string, path: string) => {
  const fileExists = existsSync(path);
  if (fileExists) {
    return ok(true);
  }
  return err(errorType, surface, {
    cause: 'file_not_found',
    message: 'File not found',
  });
};
