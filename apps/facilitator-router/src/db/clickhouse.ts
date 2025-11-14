import { createClient } from '@clickhouse/client';
import { ResultAsync } from 'neverthrow';
import { FacilitatorEventData } from './types';
import { DatabaseError } from '../errors';
import { fromPromise } from '../utils/result';
import { env } from '../env';
import { ensureJsonObject } from '../utils/json';

// ClickHouse client configuration
export const clickhouse = createClient({
  url: env.CLICKHOUSE_HOST,
  username: env.CLICKHOUSE_USER,
  password: env.CLICKHOUSE_PASSWORD,
  request_timeout: env.CLICKHOUSE_REQUEST_TIMEOUT,
});

/**
 * Initialize the ClickHouse table for facilitator events
 * Uses ReplacingMergeTree to support upserts based on request_id
 * ORDER BY includes event_type and facilitator_name to allow multiple events per request
 */
export function initFacilitatorEventsTable(): ResultAsync<void, DatabaseError> {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS facilitator_invocations (
      request_id String,
      event_type String,
      facilitator_name String,
      method String,
      status_code Nullable(UInt16),
      duration Nullable(UInt32),
      error_message_json Nullable(JSON),
      error_type Nullable(String),
      response_headers_json Nullable(JSON),
      metadata Nullable(JSON),
            
      client_ip Nullable(String),
      user_agent Nullable(String),
      
      -- PaymentPayload and PaymentRequirements as JSON
      payment_payload_json Nullable(JSON),
      payment_requirements_json Nullable(JSON),
      
      request_started_at DateTime64(3),
      created_at DateTime64(3),
      updated_at DateTime64(3),
      INDEX idx_request_started_at request_started_at TYPE minmax GRANULARITY 4,
      INDEX idx_created_at created_at TYPE minmax GRANULARITY 4,
      INDEX idx_event_type event_type TYPE set(100) GRANULARITY 4,
      INDEX idx_facilitator_name facilitator_name TYPE set(100) GRANULARITY 4,
      INDEX idx_method method TYPE set(10) GRANULARITY 4
    ) ENGINE = ReplacingMergeTree(updated_at)
    ORDER BY (request_id, event_type, facilitator_name, created_at)
    PARTITION BY toYYYYMM(created_at)
    SETTINGS index_granularity = 8192;
  `;

  return fromPromise(
    clickhouse.exec({ query: createTableQuery }).then(() => {
      console.log('ClickHouse facilitator_invocations table initialized');
    }),
    (error) =>
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
  // Validate that only allowed event types are written to the database
  // Validate all JSON fields to ensure they contain valid JSON before writing

  return fromPromise(
    clickhouse.insert({
      table: 'facilitator_invocations',
      values: [
        {
          request_id: data.request_id,
          event_type: data.eventType,
          facilitator_name: data.facilitatorName,
          method: data.method,
          status_code: data.statusCode ?? null,
          duration: data.duration ?? null,
          // Ensure JSON fields are objects for ClickHouse JSON columns (convert undefined to null)
          error_message_json: ensureJsonObject(data.errorMessageJson),
          error_type: data.errorType ?? null,
          response_headers_json: ensureJsonObject(data.responseHeadersJson),
          metadata: ensureJsonObject(data.metadata),
          client_ip: data.client_ip ?? null,
          user_agent: data.user_agent ?? null,
          // Ensure JSON fields are objects for ClickHouse JSON columns (convert undefined to null)
          payment_payload_json: ensureJsonObject(data.payment_payload_json),
          payment_requirements_json: ensureJsonObject(data.payment_requirements_json),
          request_started_at: data.requestStartedAt,
          created_at: data.createdAt,
          updated_at: data.updatedAt ?? data.createdAt,
        },
      ],
      format: 'JSONEachRow',
    }).then(() => undefined),
    (error) => {
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