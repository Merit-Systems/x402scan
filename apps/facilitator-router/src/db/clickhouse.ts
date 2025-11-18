import type { ResultAsync } from 'neverthrow';
import type { FacilitatorEventData } from './types';
import { DatabaseError } from '../errors';
import { fromPromise } from '../utils/result';
import type { FacilitatorEventType as AnalyticsFacilitatorEventType } from '@x402scan/analytics-db';
import {
  createFacilitatorInvocationsTable,
  insertFacilitatorInvocation,
  type FacilitatorInvocationData,
} from '@x402scan/analytics-db';
import { ensureJsonObject } from '../utils/json';
import type { PaymentPayload, PaymentRequirements } from 'x402/types';

/**
 * Initialize the ClickHouse table for facilitator events
 * Uses ReplacingMergeTree to support upserts based on request_id
 * ORDER BY includes event_type and facilitator_name to allow multiple events per request
 */
export function initFacilitatorEventsTable(): ResultAsync<void, DatabaseError> {
  return fromPromise(
    createFacilitatorInvocationsTable().then(() => {
      console.log('ClickHouse facilitator_invocations table initialized');
    }),
    error =>
      new DatabaseError(
        'Failed to initialize ClickHouse facilitator_invocations table',
        'initFacilitatorEventsTable',
        error
      )
  );
}

/**
 * Insert facilitator event data into ClickHouse
 * With ReplacingMergeTree, inserts with the same request_id will be deduplicated, keeping the latest version
 * Returns a Result - errors are logged but not thrown to prevent breaking the router
 * Only allows FACILITATOR_SUCCESS and FACILITATOR_FAILURE event types
 */
export function insertFacilitatorEvent(
  data: FacilitatorEventData
): ResultAsync<void, DatabaseError> {
  // Map FacilitatorEventData to FacilitatorInvocationData
  const invocationData: FacilitatorInvocationData = {
    request_id: data.request_id,
    event_type: data.eventType as AnalyticsFacilitatorEventType,
    facilitator_name: data.facilitatorName,
    method: data.method,
    status_code: data.statusCode ?? null,
    duration: data.duration ?? null,
    // Ensure JSON fields are objects for ClickHouse JSON columns (convert undefined to null)
    error_message_json: ensureJsonObject(data.errorMessageJson),
    error_type: data.errorType ?? null,
    response_headers_json:
      (ensureJsonObject(data.responseHeadersJson) as Record<string, string>) ||
      {},
    metadata: ensureJsonObject(data.metadata) as Record<
      string,
      string | number | boolean
    > | null,
    client_ip: data.client_ip ?? null,
    user_agent: data.user_agent ?? null,
    // Ensure JSON fields are objects for ClickHouse JSON columns (convert undefined to null)
    payment_payload_json: ensureJsonObject(
      data.payment_payload_json
    ) as PaymentPayload,
    payment_requirements_json: ensureJsonObject(
      data.payment_requirements_json
    ) as PaymentRequirements,
    request_started_at: data.requestStartedAt,
    created_at: data.createdAt,
    updated_at: data.updatedAt ?? data.createdAt,
  };

  return fromPromise(
    insertFacilitatorInvocation(invocationData).then(() => undefined),
    error => {
      const dbError = new DatabaseError(
        'Failed to insert facilitator event into ClickHouse',
        'insertFacilitatorEvent',
        error
      );
      console.error(dbError.message, error);
      return dbError;
    }
  );
}
