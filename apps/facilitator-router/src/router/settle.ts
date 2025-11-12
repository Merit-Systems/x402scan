import { ResultAsync } from 'neverthrow';
import {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
} from 'x402/types';
import { AllFacilitatorsFailedError } from '../errors';
import { routePayment } from './router';
import { ContextHandler } from '../utils/context-handler';
import { FacilitatorMethod } from './types';
import { FacilitatorId } from './facilitators';

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
  