import * as fs from 'fs/promises';

import { resultFromPromise } from '@x402scan/neverthrow';

import type { BaseFileSystemError } from './types';

const fsResultFromPromise = <T>(
  surface: string,
  promise: Promise<T>,
  error: (e: unknown) => BaseFileSystemError
) => resultFromPromise('fs', surface, promise, error);

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
