import type { InsertDataFunction } from './types';
import { Tables } from './types';
import { createTable, insertData } from '../utils';

const resourceInvocationsTable = `
    CREATE TABLE IF NOT EXISTS ${Tables.ResourceInvocations} (
      id String,
      resource_id Nullable(String),
      status_code UInt16,
      duration UInt32,
      status_text String,
      method String,
      url String,
      request_content_type String,
      response_content_type String,
      response_headers Nullable(String),
      response_body Nullable(String),
      request_headers Nullable(String),
      request_body Nullable(String),
      created_at DateTime64(3),
      INDEX idx_created_at created_at TYPE minmax GRANULARITY 4,
      INDEX idx_resource_id resource_id TYPE bloom_filter GRANULARITY 4,
      INDEX idx_status_code status_code TYPE set(100) GRANULARITY 4,
      INDEX idx_url url TYPE bloom_filter GRANULARITY 4
    ) ENGINE = MergeTree()
    ORDER BY (created_at, id)
    PARTITION BY toYYYYMM(created_at)
    TTL created_at + INTERVAL 90 DAY
    SETTINGS index_granularity = 8192;
`;

export const createResourceInvocationsTable = async () => {
  return createTable(resourceInvocationsTable);
};

export const insertResourceInvocation: InsertDataFunction<
  Tables.ResourceInvocations
> = async data => insertData(Tables.ResourceInvocations, [data]);

export type ResourceInvocationData = {
  id: string;
  resource_id: string | null;
  status_code: number;
  duration: number;
  status_text: string;
  method: string;
  url: string;
  request_content_type: string;
  response_content_type: string;
  created_at: Date;
  response_headers?: unknown;
  response_body?: unknown;
  request_headers?: unknown;
  request_body?: unknown;
};
