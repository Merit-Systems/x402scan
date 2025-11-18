import type { ResultAsync } from 'neverthrow';
import type {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
} from 'x402/types';
import type { AllFacilitatorsFailedError } from '../errors';
import { routePayment } from './router';
import type { ContextHandler } from '../utils/context-handler';
import { FacilitatorMethod } from './types';
import type { FacilitatorId } from './facilitators';

/**
 * Settle a payment using load-balanced facilitator routing
 */
export function settlePayment(
  payload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
  contextHandler: ContextHandler,
  facilitatorId?: FacilitatorId
): ResultAsync<SettleResponse, AllFacilitatorsFailedError> {
  return routePayment<SettleResponse>(
    FacilitatorMethod.SETTLE,
    payload,
    paymentRequirements,
    contextHandler,
    facilitatorId
  );
}
