import { ResultAsync } from 'neverthrow';
import {
  PaymentPayload,
  PaymentRequirements,
  VerifyResponse,
} from 'x402/types';
import { AllFacilitatorsFailedError } from '../errors';
import { routePayment } from './router';
import { ContextHandler } from '../utils/context-handler';
import { FacilitatorMethod } from './types';
import { FacilitatorId } from './facilitators';

/**
 * Verify a payment using load-balanced facilitator routing
 */
export function verifyPayment(
    payload: PaymentPayload,
    paymentRequirements: PaymentRequirements,
    contextHandler: ContextHandler,
    facilitatorId?: FacilitatorId
  ): ResultAsync<VerifyResponse, AllFacilitatorsFailedError> {
    return routePayment<VerifyResponse>(
      FacilitatorMethod.VERIFY,
      payload,
      paymentRequirements,
      contextHandler,
      facilitatorId
    );
  }