/**
 * Express middleware utilities for handling Result types
 * Provides seamless integration between neverthrow Results and Express responses
 */

import type { Request, Response } from 'express';
import type { Result, ResultAsync } from 'neverthrow';
import {
  AppError,
  ValidationError,
  AllFacilitatorsFailedError,
} from '../errors';
import logger from '../logger';

/**
 * Handles a Result and sends appropriate response for settle endpoint
 */
function handleSettleResult<T>(
  result: Result<T, AppError>,
  res: Response
): void {
  result.match(
    data => {
      res.json(data);
    },
    error => {
      logger.error('Settle request failed', {
        error: error.message,
        statusCode: error.statusCode,
        name: error.name,
      });

      if (error instanceof ValidationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          details: error.details,
        });
      } else if (error instanceof AllFacilitatorsFailedError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          details: error.errors,
        });
      } else if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Settlement failed',
          details: String(error),
        });
      }
    }
  );
}

/**
 * Handles a ResultAsync and sends appropriate response for settle endpoint
 */
export async function handleSettleResultAsync<T, E extends AppError>(
  resultAsync: ResultAsync<T, E>,
  res: Response
): Promise<void> {
  const result = await resultAsync;
  handleSettleResult(result, res);
}

/**
 * Handles a Result and sends appropriate response for verify endpoint
 */
function handleVerifyResult<T>(
  result: Result<T, AppError>,
  res: Response
): void {
  result.match(
    data => {
      res.json(data);
    },
    error => {
      logger.error('Verify request failed', {
        error: error.message,
        statusCode: error.statusCode,
        name: error.name,
      });

      if (error instanceof ValidationError) {
        res.status(error.statusCode).json({
          isValid: false,
          error: error.message,
          details: error.details,
        });
      } else if (error instanceof AllFacilitatorsFailedError) {
        res.status(error.statusCode).json({
          isValid: false,
          error: error.message,
          details: error.errors,
        });
      } else if (error instanceof AppError) {
        res.status(error.statusCode).json({
          isValid: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          isValid: false,
          error: 'Verification failed',
          details: String(error),
        });
      }
    }
  );
}

/**
 * Handles a ResultAsync and sends appropriate response for verify endpoint
 */
export async function handleVerifyResultAsync<T, E extends AppError>(
  resultAsync: ResultAsync<T, E>,
  res: Response
): Promise<void> {
  const result = await resultAsync;
  handleVerifyResult(result, res);
}

/**
 * Generic error handler middleware for Express
 * Catches any unhandled AppErrors and sends appropriate response
 */
export function errorHandler(err: Error, req: Request, res: Response): void {
  if (err instanceof AppError) {
    logger.error('Unhandled AppError', {
      error: err.message,
      statusCode: err.statusCode,
      name: err.name,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  } else {
    logger.error('Unhandled error', {
      error: err.message,
      name: err.name,
      path: req.path,
      method: req.method,
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
