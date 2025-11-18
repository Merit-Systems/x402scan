import type { InsertDataFunction } from './types';
import { Tables } from './types';
import { createTable, insertData } from '../utils';
import type { PaymentPayload, PaymentRequirements } from 'x402/types';

/**
 * Event types for facilitator events
 */
export enum FacilitatorEventType {
  FACILITATOR_SUCCESS = 'facilitator_success',
  FACILITATOR_FAILURE = 'facilitator_failure',
}

const facilitatorInvocationsTable = `
    CREATE TABLE IF NOT EXISTS ${Tables.FacilitatorInvocations} (
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

export const createFacilitatorInvocationsTable = async () => {
  return createTable(facilitatorInvocationsTable);
};

export const insertFacilitatorInvocation: InsertDataFunction<
  Tables.FacilitatorInvocations
> = async data => insertData(Tables.FacilitatorInvocations, [data]);

export interface FacilitatorInvocationData {
  request_id: string;
  event_type: FacilitatorEventType;
  facilitator_name: string;
  method: string; // 'verify' or 'settle'
  status_code?: number | null;
  duration?: number | null;
  error_message_json?: Record<string, unknown> | null;
  error_type?: string | null;
  response_headers_json: Record<string, string>;
  metadata?: Record<string, string | number | boolean> | null;

  client_ip?: string | null;
  user_agent?: string | null;

  // PaymentPayload and PaymentRequirements as objects for ClickHouse JSON columns
  payment_payload_json?: PaymentPayload | null;
  payment_requirements_json?: PaymentRequirements | null;

  request_started_at: Date; // When the request started (from context.createdAt)
  created_at: Date; // When this specific event occurred
  updated_at: Date; // Used for ReplacingMergeTree versioning
}
