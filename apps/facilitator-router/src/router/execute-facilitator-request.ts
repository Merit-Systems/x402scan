import type { ResultAsync } from 'neverthrow';
import type {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  VerifyResponse,
} from 'x402/types';
import { FacilitatorError, InvalidDataError } from '../errors';
import { fromPromise } from '../utils/result';
import { useFacilitator } from '../facilitator/use-facilitator';
import type { Facilitator } from './types';
import { FacilitatorMethod } from './types';
import type { ContextHandler } from '../utils/context-handler';
import {
  logFacilitatorFailure,
  logFacilitatorSuccess,
} from './log-facilitator';

/**
 * Execute a single facilitator request
 */
export function executeFacilitatorRequest<
  T extends VerifyResponse | SettleResponse,
>(
  facilitator: Facilitator,
  method: FacilitatorMethod,
  payload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
  contextHandler: ContextHandler
): ResultAsync<T, FacilitatorError> {
  const facilitatorStartTime = Date.now();

  return fromPromise(
    (async () => {
      const facilitatorClient = useFacilitator(facilitator, facilitator.name);

      const result = await (async () => {
        switch (method) {
          case FacilitatorMethod.VERIFY:
            return (await facilitatorClient.verify(
              payload,
              paymentRequirements
            )) as T;
          case FacilitatorMethod.SETTLE:
            return (await facilitatorClient.settle(
              payload,
              paymentRequirements
            )) as T;
          default:
            throw new InvalidDataError(`Unknown method: ${String(method)}`);
        }
      })();

      logFacilitatorSuccess(
        facilitator.name,
        method,
        facilitatorStartTime,
        contextHandler
      );

      return result;
    })(),
    error => {
      if (error instanceof FacilitatorError) {
        logFacilitatorFailure(
          error,
          facilitator.name,
          method,
          facilitatorStartTime,
          contextHandler
        );
      }
      throw error;
    }
  );
}
