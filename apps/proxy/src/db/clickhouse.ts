import { createClient } from '@clickhouse/client';

// ClickHouse client configuration
export const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST ?? 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER ?? 'default',
  password: process.env.CLICKHOUSE_PASSWORD ?? '',
  database: process.env.CLICKHOUSE_DATABASE ?? 'default',
});

export interface ProxyLogData {
  id: string;
  resourceId: string | null;
  statusCode: number;
  duration: number;
  statusText: string;
  method: string;
  url: string;
  requestContentType: string;
  responseContentType: string;
  responseHeaders?: unknown;
  responseBody?: unknown;
  requestHeaders?: unknown;
  requestBody?: unknown;
  createdAt: Date;
}

/**
 * Initialize the ClickHouse table for resource invocations (matches Prisma ResourceInvocation)
 */
export async function initClickHouseTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS resource_invocations (
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

  try {
    await clickhouse.exec({ query: createTableQuery });
    console.log('ClickHouse resource_invocations table initialized');
  } catch (error) {
    console.error('Failed to initialize ClickHouse table:', error);
    throw error;
  }
}

/**
 * Insert resource invocation data into ClickHouse (matches Prisma ResourceInvocation)
 */
export async function insertResourceInvocation(data: ProxyLogData) {
  try {
    await clickhouse.insert({
      table: 'resource_invocations',
      values: [
        {
          id: data.id,
          resource_id: data.resourceId,
          status_code: data.statusCode,
          duration: data.duration,
          status_text: data.statusText,
          method: data.method,
          url: data.url,
          request_content_type: data.requestContentType,
          response_content_type: data.responseContentType,
          response_headers: data.responseHeaders
            ? JSON.stringify(data.responseHeaders)
            : null,
          response_body: data.responseBody
            ? JSON.stringify(data.responseBody)
            : null,
          request_headers: data.requestHeaders
            ? JSON.stringify(data.requestHeaders)
            : null,
          request_body: data.requestBody
            ? JSON.stringify(data.requestBody)
            : null,
          created_at: data.createdAt,
        },
      ],
      format: 'JSONEachRow',
    });
  } catch (error) {
    console.error(
      'Failed to insert resource invocation into ClickHouse:',
      error
    );
    // Don't throw - we don't want to break the proxy if ClickHouse is down
  }
}
