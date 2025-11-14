/**
 * Utilities for managing request context and building events
 */

import { Request } from 'express';
import { randomUUID } from 'crypto';
import { Result } from 'neverthrow';
import { RequestContext, FacilitatorEventData, FacilitatorEventType } from '../db/types';
import { PaymentPayload, PaymentRequirements } from 'x402/types';
import { ValidationError } from '../errors';

/**
 * Creates a new request context with a unique event ID
 */
export function createRequestContext(): RequestContext {
  return {
    eventId: randomUUID(),
    createdAt: new Date(),
  };
}

/**
 * Extracts request metadata from Express Request object
 */
export function extractRequestMetadata(req: Request): {
  client_ip?: string;
  user_agent?: string;
} {
  return {
    client_ip: req.ip || req.socket.remoteAddress,
    user_agent: req.get('user-agent'),
  };
}

/**
 * Updates context with request data (payload/requirements validation results)
 * This is called once when request is validated to populate context
 */
export function updateContextWithRequestData(
  context: RequestContext,
  requestData: {
    payloadResult: Result<PaymentPayload, ValidationError>;
    requirementsResult: Result<PaymentRequirements, ValidationError>;
    rawPayload?: unknown;
    rawRequirements?: unknown;
    client_ip?: string;
    user_agent?: string;
  }
): void {
  // Update client_ip and user_agent if provided
  if (requestData.client_ip) {
    context.client_ip = requestData.client_ip;
  }
  if (requestData.user_agent) {
    context.user_agent = requestData.user_agent;
  }

  const isPayloadValid = requestData.payloadResult.isOk();
  const isRequirementsValid = requestData.requirementsResult.isOk();
  const invalidPayload = !isPayloadValid || !isRequirementsValid;

  if (!invalidPayload) {
    // Valid payload - extract and store data
    const payload = requestData.payloadResult._unsafeUnwrap();
    const requirements = requestData.requirementsResult._unsafeUnwrap();

    // Store original validated objects for JSON serialization
    context.validatedPayload = payload;
    context.validatedRequirements = requirements;

    context.payloadData = {
      x402_version: payload.x402Version,
      payload_scheme: payload.scheme,
      payload_network: payload.network,
    };

    // Set EVM or SVM payload fields based on scheme
    if ('signature' in payload.payload) {
      // EVM payload
      context.payloadData.evm_signature = payload.payload.signature;
      context.payloadData.evm_from = payload.payload.authorization.from;
      context.payloadData.evm_to = payload.payload.authorization.to;
      context.payloadData.evm_value = payload.payload.authorization.value;
      context.payloadData.evm_valid_after = payload.payload.authorization.validAfter;
      context.payloadData.evm_valid_before = payload.payload.authorization.validBefore;
      context.payloadData.evm_nonce = payload.payload.authorization.nonce;
    } else if ('transaction' in payload.payload) {
      // SVM payload
      context.payloadData.svm_transaction = payload.payload.transaction;
    }

    context.requirementsData = {
      requirements_scheme: requirements.scheme,
      requirements_network: requirements.network,
      max_amount_required: requirements.maxAmountRequired,
      resource: requirements.resource,
      description: requirements.description,
      mime_type: requirements.mimeType,
      pay_to: requirements.payTo,
      max_timeout_seconds: requirements.maxTimeoutSeconds,
      asset: requirements.asset,
    };
  }
}

/**
 * Builds a complete FacilitatorEventData object from context + event-specific data
 */
export function buildFacilitatorEvent(
  context: RequestContext,
  eventType: FacilitatorEventType,
  eventData: {
    facilitatorName: string;
    method: string;
    statusCode?: number;
    duration?: number;
    errorMessageJson?: Record<string, unknown>;
    errorType?: string;
    responseHeadersJson: Record<string, string>;
    metadata?: Record<string, string | number | boolean>;
    paymentHeader?: string;
    paymentResponseHeader?: string;
  }
): FacilitatorEventData {
  const now = new Date();
  
  return {
    request_id: context.eventId,
    eventType,
    facilitatorName: eventData.facilitatorName,
    method: eventData.method,
    statusCode: eventData.statusCode,
    duration: eventData.duration,
    errorMessageJson: eventData.errorMessageJson,
    errorType: eventData.errorType,
    responseHeadersJson: eventData.responseHeadersJson,
    metadata: eventData.metadata,
    // Context data
    client_ip: context.client_ip,
    user_agent: context.user_agent,
    // Pass objects directly for ClickHouse JSON columns
    payment_payload_json: context.validatedPayload,
    payment_requirements_json: context.validatedRequirements,
    requestStartedAt: context.createdAt,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Merges metadata objects, combining attributes and event metadata
 */
export function mergeMetadata(
  attributes?: Record<string, string | number | boolean>,
  eventMetadata?: Record<string, string | number | boolean>
): Record<string, string | number | boolean> | undefined {
  const merged = {
    ...(attributes as Record<string, string | number | boolean>),
    ...(eventMetadata as Record<string, string | number | boolean>),
  };

  // Return undefined if no metadata to avoid empty objects
  return Object.keys(merged).length > 0 ? merged : undefined;
}

