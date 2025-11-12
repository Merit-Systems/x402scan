/**
 * Utility functions for integrating neverthrow with Zod
 * Provides type-safe error handling throughout the application
 */

import { ResultAsync } from 'neverthrow';
import { AppError } from '../errors';

/**
 * Wraps a promise in a ResultAsync, converting errors to AppError
 */
export function fromPromise<T, E extends AppError>(
  promise: Promise<T>,
  errorFactory: (error: unknown) => E
): ResultAsync<T, E> {
  return ResultAsync.fromPromise(promise, errorFactory);
}

/**
 * Executes a ResultAsync in a fire-and-forget manner
 * Errors are logged to console but don't propagate
 */
export function fireAndForget<T, E>(
  resultAsync: ResultAsync<T, E>,
  onError?: (error: E) => void
): void {
  void (async () => {
    const result = await resultAsync;
    if (result.isErr()) {
      if (onError) {
        onError(result.error);
      } else {
        console.error('Fire-and-forget operation failed:', result.error);
      }
    }
  })();
}
