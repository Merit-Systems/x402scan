import type { Request } from 'express';
import type { PaymentPayload, PaymentRequirements } from 'x402/types';
import { PaymentPayloadSchema, PaymentRequirementsSchema } from 'x402/types';
import type { Result } from 'neverthrow';
import { err, ok } from 'neverthrow';
import { ContextHandler } from '../utils/context-handler';
import type { FacilitatorId } from '../router/facilitators';
import { FacilitatorIdSchema } from '../router/facilitators';
import { ValidationError } from '../errors';

interface ValidatedRequestData {
  validatedPayload: PaymentPayload;
  validatedRequirements: PaymentRequirements;
  facilitatorId?: FacilitatorId;
  contextHandler: ContextHandler;
}

/**
 * Validates payment request body and creates context handler
 * Extracts shared validation logic from settle/verify handlers
 */
export function validatePaymentRequest(
  req: Request
): Result<ValidatedRequestData, ValidationError> {
  const { paymentPayload, paymentRequirements, facilitatorId } = req.body as {
    paymentPayload: PaymentPayload;
    paymentRequirements: PaymentRequirements;
    facilitatorId?: FacilitatorId;
  };

  // Create context handler for this request
  const contextHandler = ContextHandler.fromRequest(req);

  // Validate request body using neverthrow + zod
  const payloadParseResult = PaymentPayloadSchema.safeParse(paymentPayload);
  const payloadResult: Result<PaymentPayload, ValidationError> =
    payloadParseResult.success
      ? ok(payloadParseResult.data)
      : err(
          new ValidationError(
            'Invalid request payload',
            payloadParseResult.error.message
          )
        );

  const requirementsParseResult =
    PaymentRequirementsSchema.safeParse(paymentRequirements);
  const requirementsResult: Result<PaymentRequirements, ValidationError> =
    requirementsParseResult.success
      ? ok(requirementsParseResult.data)
      : err(
          new ValidationError(
            'Invalid request requirements',
            requirementsParseResult.error.message
          )
        );

  // Validate facilitatorId if provided
  const facilitatorIdResult: Result<FacilitatorId, ValidationError> | null =
    facilitatorId !== undefined
      ? (() => {
          const parseResult = FacilitatorIdSchema.safeParse(facilitatorId);
          return parseResult.success
            ? ok(parseResult.data)
            : err(
                new ValidationError(
                  'Invalid facilitator ID',
                  parseResult.error.message
                )
              );
        })()
      : null;

  // Update context with request data (validation results)
  contextHandler.updateWithRequestData({
    payloadResult: payloadResult,
    requirementsResult: requirementsResult,
    rawPayload: paymentPayload,
    rawRequirements: paymentRequirements,
  });

  // Combine validation results - include facilitatorId validation if provided
  return payloadResult.andThen(validatedPayload =>
    requirementsResult.andThen(validatedRequirements => {
      // If facilitatorId was provided, validate it
      if (facilitatorIdResult) {
        return facilitatorIdResult.map(validatedFacilitatorId => ({
          validatedPayload,
          validatedRequirements,
          facilitatorId: validatedFacilitatorId,
          contextHandler,
        }));
      }
      // If not provided, return without facilitatorId
      return ok({
        validatedPayload,
        validatedRequirements,
        contextHandler,
      });
    })
  );
}
