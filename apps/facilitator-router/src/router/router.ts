import type { IPolicy } from 'cockatiel';
import { retry, handleAll, wrap, timeout, TimeoutStrategy } from 'cockatiel';
import { ResultAsync } from 'neverthrow';
import type {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  VerifyResponse,
} from 'x402/types';
import logger from '../logger';
import { AllFacilitatorsFailedError, FacilitatorFailedError } from '../errors';
import type { FacilitatorMethod, Facilitator } from './types';
import type { FacilitatorId } from './facilitators';
import { getNextFacilitator, getFacilitatorById } from './facilitators';
import { executeFacilitatorRequest } from './execute-facilitator-request';
import type { ContextHandler } from '../utils/context-handler';
import { env } from '../env';
import { ConstantBackoff } from 'cockatiel';

/**
 * Creates a cockatiel policy configuration with retry, timeout, and circuit breaker
 */
function createCockatielPolicy(facilitator: Facilitator): IPolicy {
  const retryPolicy = retry(handleAll, {
    maxAttempts: env.RETRY_MAX_ATTEMPTS,
    backoff: new ConstantBackoff(env.RETRY_BACKOFF_DELAY),
  });

  const timeoutPolicy = timeout(env.TIMEOUT_LENGTH, TimeoutStrategy.Aggressive);

  if (env.USE_CIRCUIT_BREAKER && facilitator.circuitBreaker) {
    return wrap(retryPolicy, timeoutPolicy, facilitator.circuitBreaker);
  }
  return wrap(retryPolicy, timeoutPolicy);
}

/**
 * Attempts to execute a facilitator request with retry, timeout, and circuit breaker protection
 */
async function attemptFacilitator<T extends VerifyResponse | SettleResponse>(
  facilitator: Facilitator,
  method: FacilitatorMethod,
  payload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
  contextHandler: ContextHandler,
  attemptNumber: number
): Promise<T> {
  const policy = createCockatielPolicy(facilitator);

  logger.info(`Attempting ${facilitator.name} for ${method}`, {
    facilitator: facilitator.name,
    method,
    attemptNumber,
  });

  return await policy.execute(async () => {
    const resultAsync = executeFacilitatorRequest<T>(
      facilitator,
      method,
      payload,
      paymentRequirements,
      contextHandler
    );
    const res = await resultAsync;
    if (res.isErr()) {
      throw res.error;
    }
    return res.value;
  });
}

/**
 * Attempts to execute a facilitator request with neverthrow, throwing FacilitatorFailedError on failure
 */
function attemptFacilitatorWithNeverthrow<
  T extends VerifyResponse | SettleResponse,
>(
  facilitator: Facilitator,
  method: FacilitatorMethod,
  payload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
  contextHandler: ContextHandler,
  attemptNumber: number
): ResultAsync<T, FacilitatorFailedError> {
  return ResultAsync.fromPromise(
    attemptFacilitator<T>(
      facilitator,
      method,
      payload,
      paymentRequirements,
      contextHandler,
      attemptNumber
    ),
    error => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return new FacilitatorFailedError(facilitator.name, errorMessage);
    }
  );
}

/**
 * Calls a specific facilitator by ID
 *
 * @param method - The facilitator method to call ('verify' or 'settle')
 * @param payload - The payment payload
 * @param paymentRequirements - The payment requirements
 * @param contextHandler - Context handler for accumulating event data
 * @param facilitatorId - The facilitator ID to call
 * @returns A ResultAsync that resolves to the facilitator response or AllFacilitatorsFailedError
 */
function callFacilitator<T extends VerifyResponse | SettleResponse>(
  method: FacilitatorMethod,
  payload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
  contextHandler: ContextHandler,
  facilitatorId: FacilitatorId
): ResultAsync<T, AllFacilitatorsFailedError> {
  return ResultAsync.fromPromise(
    (async () => {
      const facilitator = getFacilitatorById(facilitatorId);

      if (!facilitator) {
        throw new AllFacilitatorsFailedError(method, [
          { facilitator: facilitatorId, error: 'Facilitator not found' },
        ]);
      }

      const result = await attemptFacilitatorWithNeverthrow<T>(
        facilitator,
        method,
        payload,
        paymentRequirements,
        contextHandler,
        1
      );

      if (result.isErr()) {
        const error = result.error;
        throw new AllFacilitatorsFailedError(method, [
          { facilitator: error.facilitatorName, error: error.error },
        ]);
      }

      return result.value;
    })(),
    error => error as AllFacilitatorsFailedError
  );
}

/**
 * Routes payment requests to facilitators using round-robin load balancing with circuit breakers
 *
 * @param method - The facilitator method to call ('verify' or 'settle')
 * @param payload - The payment payload
 * @param paymentRequirements - The payment requirements
 * @param contextHandler - Context handler for accumulating event data
 * @returns A ResultAsync that resolves to the facilitator response or AllFacilitatorsFailedError
 */
function callAutoFacilitator<T extends VerifyResponse | SettleResponse>(
  method: FacilitatorMethod,
  payload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
  contextHandler: ContextHandler
): ResultAsync<T, AllFacilitatorsFailedError> {
  return ResultAsync.fromPromise(
    (async () => {
      const errors: Array<{ facilitator: string; error: string }> = [];
      const attemptedFacilitators = new Set<string>();
      const maxAttempts = env.MAX_FACILITATOR_ATTEMPTS;

      // Try each facilitator once using round-robin load balancing
      for (let i = 0; i < maxAttempts; i++) {
        const facilitator = getNextFacilitator();
        attemptedFacilitators.add(facilitator.name);

        const result = await attemptFacilitatorWithNeverthrow<T>(
          facilitator,
          method,
          payload,
          paymentRequirements,
          contextHandler,
          attemptedFacilitators.size
        );

        if (result.isErr()) {
          const error = result.error;
          errors.push({
            facilitator: error.facilitatorName,
            error: error.error,
          });
          continue;
        }

        return result.value;
      }
      throw new AllFacilitatorsFailedError(method, errors);
    })(),
    error => error as AllFacilitatorsFailedError
  );
}

/**
 * Routes payment requests to facilitators with load balancing and circuit breakers
 *
 * @param method - The facilitator method to call ('verify' or 'settle')
 * @param payload - The payment payload
 * @param paymentRequirements - The payment requirements
 * @param contextHandler - Context handler for accumulating event data
 * @param facilitatorId - Optional facilitator ID to use (if provided, only this facilitator will be attempted)
 * @returns A ResultAsync that resolves to the facilitator response or AllFacilitatorsFailedError
 */
export function routePayment<T extends VerifyResponse | SettleResponse>(
  method: FacilitatorMethod,
  payload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
  contextHandler: ContextHandler,
  facilitatorId?: FacilitatorId
): ResultAsync<T, AllFacilitatorsFailedError> {
  if (facilitatorId && facilitatorId !== 'auto') {
    return callFacilitator(
      method,
      payload,
      paymentRequirements,
      contextHandler,
      facilitatorId
    );
  }
  return callAutoFacilitator(
    method,
    payload,
    paymentRequirements,
    contextHandler
  );
}
