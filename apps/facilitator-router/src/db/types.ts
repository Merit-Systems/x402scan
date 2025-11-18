import type { PaymentPayload, PaymentRequirements } from 'x402/types';

/**
 * Event types for facilitator events
 */
export enum FacilitatorEventType {
  FACILITATOR_SUCCESS = 'facilitator_success',
  FACILITATOR_FAILURE = 'facilitator_failure',
}

export interface FacilitatorEventData {
  request_id: string;
  eventType: FacilitatorEventType;
  facilitatorName: string;
  method: string; // 'verify' or 'settle'
  statusCode?: number;
  duration?: number;
  errorMessageJson?: Record<string, unknown>;
  errorType?: string;
  responseHeadersJson: Record<string, string>;
  metadata?: Record<string, string | number | boolean>;

  client_ip?: string;
  user_agent?: string;

  // PaymentPayload and PaymentRequirements as objects for ClickHouse JSON columns
  payment_payload_json?: PaymentPayload;
  payment_requirements_json?: PaymentRequirements;

  requestStartedAt: Date; // When the request started (from context.createdAt)
  createdAt: Date; // When this specific event occurred
  updatedAt: Date; // Used for ReplacingMergeTree versioning
}

/**
 * Request context holding immutable request data for the entire request lifecycle
 */
export interface RequestContext {
  eventId: string;
  client_ip?: string;
  user_agent?: string;
  // Validated payload/requirements data (only set if validation succeeded)
  payloadData?: {
    x402_version: number;
    payload_scheme: string;
    payload_network: string;
    evm_signature?: string;
    evm_from?: string;
    evm_to?: string;
    evm_value?: string;
    evm_valid_after?: string;
    evm_valid_before?: string;
    evm_nonce?: string;
    svm_transaction?: string;
  };
  requirementsData?: {
    requirements_scheme: string;
    requirements_network: string;
    max_amount_required: string;
    resource: string;
    description: string;
    mime_type: string;
    pay_to: string;
    max_timeout_seconds: number;
    asset: string;
  };
  // Original validated objects for JSON serialization
  validatedPayload?: PaymentPayload;
  validatedRequirements?: PaymentRequirements;
  createdAt: Date;
}
