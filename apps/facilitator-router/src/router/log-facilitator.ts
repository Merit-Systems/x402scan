import type { FacilitatorError } from '../errors';
import logger from '../logger';
import type { FacilitatorMethod } from './types';
import type { ContextHandler } from '../utils/context-handler';
import { FacilitatorEventType } from '../db/types';

/**
 * Logs a facilitator failure
 */
export function logFacilitatorFailure(
  error: FacilitatorError,
  facilitatorName: string,
  method: FacilitatorMethod,
  facilitatorStartTime: number,
  contextHandler: ContextHandler
): void {
  const facilitatorDuration = Date.now() - facilitatorStartTime;

  logger.warn(
    `${facilitatorName} failed for ${method}, trying next facilitator`,
    {
      facilitator: facilitatorName,
      method,
      error: error.message,
    }
  );

  // Log individual facilitator failure to ClickHouse
  // This allows tracking failure rates per facilitator even when routing eventually succeeds
  contextHandler.logMetric(
    FacilitatorEventType.FACILITATOR_FAILURE,
    1,
    {
      method,
      facilitator: facilitatorName,
      errorType: 'facilitator_error',
    },
    {
      facilitatorName,
      method,
      statusCode: error.httpStatus,
      duration: facilitatorDuration,
      errorMessageJson: error.errorMessageJson,
      errorType: 'facilitator_error',
      responseHeadersJson: error.responseHeaders,
    }
  );
}

/**
 * Logs a facilitator success event
 */
export function logFacilitatorSuccess(
  facilitatorName: string,
  method: FacilitatorMethod,
  facilitatorStartTime: number,
  contextHandler: ContextHandler
): void {
  const facilitatorDuration = Date.now() - facilitatorStartTime;

  logger.info(`${facilitatorName} facilitator ${method} succeeded`, {
    facilitator: facilitatorName,
    method,
  });

  // Log final success outcome - this is the only event logged for successful requests
  contextHandler.logMetric(
    FacilitatorEventType.FACILITATOR_SUCCESS,
    1,
    {
      method,
      facilitator: facilitatorName,
    },
    {
      facilitatorName,
      method,
      statusCode: 200,
      duration: facilitatorDuration,
      responseHeadersJson: {},
    }
  );
}
