import { Request, Response } from 'express';
import { PaymentPayload, PaymentRequirements } from 'x402/types';
import logger from '../logger';
import { handleSettleResultAsync } from '../utils/express-result';
import { settlePayment } from '../router/settle';
import { FacilitatorId } from '../router/facilitators';
import { ContextHandler } from '../utils/context-handler';
import { validatePaymentRequest } from './validate';

export async function settleHandler(req: Request, res: Response): Promise<void> {
  const validationResult = validatePaymentRequest(req);

  // Process the request or handle validation error
  const resultAsync = validationResult.asyncAndThen(
    ({ validatedPayload, validatedRequirements, facilitatorId, contextHandler }: { validatedPayload: PaymentPayload; validatedRequirements: PaymentRequirements; facilitatorId?: FacilitatorId; contextHandler: ContextHandler }) => {
      logger.info('Settle request received', {
        network: validatedPayload.network,
        scheme: validatedPayload.scheme,
      });

      // Route to appropriate facilitator using load balancing
      // The router will log the final outcome with request context
      return settlePayment(
        validatedPayload,
        validatedRequirements,
        contextHandler,
        facilitatorId
      );
    }
  ).mapErr((error) => {
    // Log validation errors as INVALID_PAYLOAD - this tracks failed validation attempts
    // Just return 400, end client are fucking up, just return a useful error to them
    // don't write to clickhouse
    return error;
  });

  await handleSettleResultAsync(resultAsync, res);
}

