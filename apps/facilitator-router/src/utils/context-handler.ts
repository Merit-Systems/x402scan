/**
 * ContextHandler class for managing request context and metric logging
 * Maintains immutable request context and builds events from context + event data
 */

import { Request } from 'express';
import { Result } from 'neverthrow';
import { RequestContext, FacilitatorEventType } from '../db/types';
import { PaymentPayload, PaymentRequirements } from 'x402/types';
import { ValidationError } from '../errors';
import { insertFacilitatorEvent } from '../db/clickhouse';
import { logMetric } from '../logger';
import {
  buildFacilitatorEvent,
  mergeMetadata,
  createRequestContext,
  extractRequestMetadata,
  updateContextWithRequestData
} from './event-context';
import { fireAndForget } from './result';

/**
 * ContextHandler manages request context and metric logging
 * All metric logging should go through an instance of this class
 */
export class ContextHandler {
  private context: RequestContext;

  /**
   * Creates a new ContextHandler with a new context
   */
  constructor(context?: RequestContext) {
    this.context = context ?? createRequestContext();
  }

  /**
   * Creates a ContextHandler from an Express Request
   * Extracts request metadata and initializes context
   */
  static fromRequest(req: Request): ContextHandler {
    const handler = new ContextHandler();
    const metadata = extractRequestMetadata(req);
    
    // Set initial metadata
    handler.context.client_ip = metadata.client_ip;
    handler.context.user_agent = metadata.user_agent;

    return handler;
  }

  /**
   * Gets the current context
   */
  getContext(): RequestContext {
    return this.context;
  }

  /**
   * Gets the event ID
   */
  getEventId(): string {
    return this.context.eventId;
  }

  /**
   * Updates context with request data (payload/requirements validation results)
   * Should be called once when request is validated
   */
  updateWithRequestData(requestData: {
    payloadResult: Result<PaymentPayload, ValidationError>;
    requirementsResult: Result<PaymentRequirements, ValidationError>;
    rawPayload?: unknown;
    rawRequirements?: unknown;
    client_ip?: string;
    user_agent?: string;
  }): void {
    updateContextWithRequestData(this.context, requestData);
  }

  /**
   * Logs a metric with event-specific data
   * All metric logging should use this method
   */
  logMetric(
    eventType: FacilitatorEventType,
    value: number = 1,
    attributes?: Record<string, string | number | boolean>,
    eventData?: {
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
  ): void {
    // Log to OpenTelemetry
    logMetric(eventType, value, attributes);

    // Merge metadata
    const mergedMetadata = mergeMetadata(attributes, eventData?.metadata);

    // Build complete event from context + event data
    const facilitatorEvent = buildFacilitatorEvent(
      this.context,
      eventType,
      {
        facilitatorName: eventData?.facilitatorName ?? 'unknown',
        method: eventData?.method ?? 'unknown',
        statusCode: eventData?.statusCode,
        duration: eventData?.duration,
        errorMessageJson: eventData?.errorMessageJson,
        errorType: eventData?.errorType,
        responseHeadersJson: eventData?.responseHeadersJson ?? {},
        metadata: mergedMetadata,
        paymentHeader: eventData?.paymentHeader,
        paymentResponseHeader: eventData?.paymentResponseHeader,
      }
    );

    // Fire and forget - don't wait for ClickHouse
    fireAndForget(
      insertFacilitatorEvent(facilitatorEvent),
      (error) => console.error('Failed to insert facilitator event:', error)
    );
  }
}

