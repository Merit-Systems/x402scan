import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/trpc/trpc';
import { clickhouse } from '@/services/db/clickhouse/resource-invocations';

export const facilitatorObservabilityRouter = createTRPCRouter({
  statusCodes: publicProcedure
    .input(
      z.object({
        facilitatorName: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        bucketMinutes: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { facilitatorName, startDate, endDate, bucketMinutes } = input;

      const start = new Date(startDate);
      const end = new Date(endDate);

      const query = `
        SELECT
          toStartOfInterval(created_at, INTERVAL {bucketMinutes: UInt32} MINUTE) AS ts,
          countIf(status_code >= 200 AND status_code < 300) AS r_2xx,
          countIf(status_code >= 300 AND status_code < 400) AS r_3xx,
          countIf(status_code >= 400 AND status_code < 500) AS r_4xx,
          countIf(status_code >= 500) AS r_5xx
        FROM facilitator_invocations
        WHERE facilitator_name = {facilitatorName: String}
          AND created_at >= toDateTime({start: String})
          AND created_at <= toDateTime({end: String})
        GROUP BY ts
        ORDER BY ts ASC
      `;

      const resultSet = await clickhouse.query({
        query,
        format: 'JSONEachRow',
        query_params: {
          facilitatorName,
          start: start.toISOString().replace('T', ' ').split('.')[0],
          end: end.toISOString().replace('T', ' ').split('.')[0],
          bucketMinutes,
        },
      });

      const data = await resultSet.json();
      return data as Array<{
        ts: string;
        r_2xx: string;
        r_3xx: string;
        r_4xx: string;
        r_5xx: string;
      }>;
    }),

  errorRate: publicProcedure
    .input(
      z.object({
        facilitatorName: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        bucketMinutes: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { facilitatorName, startDate, endDate, bucketMinutes } = input;

      const start = new Date(startDate);
      const end = new Date(endDate);

      const query = `
        SELECT
          toStartOfInterval(created_at, INTERVAL {bucketMinutes: UInt32} MINUTE) AS ts,
          count() AS total_requests,
          countIf(status_code >= 400) AS error_requests,
          (countIf(status_code >= 400) * 100.0 / count()) AS error_rate
        FROM facilitator_invocations
        WHERE facilitator_name = {facilitatorName: String}
          AND created_at >= toDateTime({start: String})
          AND created_at <= toDateTime({end: String})
        GROUP BY ts
        ORDER BY ts ASC
      `;

      const resultSet = await clickhouse.query({
        query,
        format: 'JSONEachRow',
        query_params: {
          facilitatorName,
          start: start.toISOString().replace('T', ' ').split('.')[0],
          end: end.toISOString().replace('T', ' ').split('.')[0],
          bucketMinutes,
        },
      });

      const data = await resultSet.json();
      return data as Array<{
        ts: string;
        total_requests: string;
        error_requests: string;
        error_rate: string;
      }>;
    }),

  latency: publicProcedure
    .input(
      z.object({
        facilitatorName: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        bucketMinutes: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { facilitatorName, startDate, endDate, bucketMinutes } = input;

      const start = new Date(startDate);
      const end = new Date(endDate);

      const query = `
        SELECT
          toStartOfInterval(created_at, INTERVAL {bucketMinutes: UInt32} MINUTE) AS ts,
          quantile(0.5)(duration) AS p50,
          quantile(0.9)(duration) AS p90,
          quantile(0.99)(duration) AS p99
        FROM facilitator_invocations
        WHERE facilitator_name = {facilitatorName: String}
          AND created_at >= toDateTime({start: String})
          AND created_at <= toDateTime({end: String})
          AND duration IS NOT NULL
        GROUP BY ts
        ORDER BY ts ASC
      `;

      const resultSet = await clickhouse.query({
        query,
        format: 'JSONEachRow',
        query_params: {
          facilitatorName,
          start: start.toISOString().replace('T', ' ').split('.')[0],
          end: end.toISOString().replace('T', ' ').split('.')[0],
          bucketMinutes,
        },
      });

      const data = await resultSet.json();
      return data as Array<{
        ts: string;
        p50: string;
        p90: string;
        p99: string;
      }>;
    }),

  methods: publicProcedure
    .input(
      z.object({
        facilitatorName: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { facilitatorName, startDate, endDate } = input;

      const start = new Date(startDate);
      const end = new Date(endDate);

      const query = `
        SELECT
          method,
          count() AS total_requests,
          countIf(status_code >= 400) AS error_count,
          avg(duration) AS avg_duration,
          max(created_at) AS last_seen
        FROM facilitator_invocations
        WHERE facilitator_name = {facilitatorName: String}
          AND created_at >= toDateTime({start: String})
          AND created_at <= toDateTime({end: String})
        GROUP BY method
        ORDER BY total_requests DESC
        LIMIT 100
      `;

      const resultSet = await clickhouse.query({
        query,
        format: 'JSONEachRow',
        query_params: {
          facilitatorName,
          start: start.toISOString().replace('T', ' ').split('.')[0],
          end: end.toISOString().replace('T', ' ').split('.')[0],
        },
      });

      const data = await resultSet.json();
      return data as Array<{
        method: string;
        total_requests: string;
        error_count: string;
        avg_duration: string;
        last_seen: string;
      }>;
    }),

  invocations: publicProcedure
    .input(
      z.object({
        facilitatorName: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        page: z.number().default(1),
        pageSize: z.number().default(50),
        statusFilter: z.string().default('all'),
        methodFilter: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const {
        facilitatorName,
        startDate,
        endDate,
        page,
        pageSize,
        statusFilter,
        methodFilter,
      } = input;

      const start = new Date(startDate);
      const end = new Date(endDate);
      const offset = (page - 1) * pageSize;

      let statusCondition = '';
      if (statusFilter === '2xx') {
        statusCondition = 'AND status_code >= 200 AND status_code < 300';
      } else if (statusFilter === '3xx') {
        statusCondition = 'AND status_code >= 300 AND status_code < 400';
      } else if (statusFilter === '4xx') {
        statusCondition = 'AND status_code >= 400 AND status_code < 500';
      } else if (statusFilter === '5xx') {
        statusCondition = 'AND status_code >= 500 AND status_code < 600';
      }

      const methodCondition = methodFilter
        ? 'AND method = {methodFilter: String}'
        : '';

      const countQuery = `
        SELECT count() AS total
        FROM facilitator_invocations
        WHERE facilitator_name = {facilitatorName: String}
          AND created_at >= toDateTime({start: String})
          AND created_at <= toDateTime({end: String})
          ${statusCondition}
          ${methodCondition}
      `;

      const countResultSet = await clickhouse.query({
        query: countQuery,
        format: 'JSONEachRow',
        query_params: {
          facilitatorName,
          start: start.toISOString().replace('T', ' ').split('.')[0],
          end: end.toISOString().replace('T', ' ').split('.')[0],
          ...(methodFilter && { methodFilter }),
        },
      });

      const countData = await countResultSet.json();
      const totalStr = (countData as Array<{ total: string }>)[0]?.total ?? '0';
      const total = parseInt(totalStr);

      const dataQuery = `
        SELECT
          request_id,
          event_type,
          method,
          status_code,
          duration,
          error_type,
          error_message_json,
          response_headers_json,
          metadata,
          client_ip,
          user_agent,
          payment_payload_json,
          payment_requirements_json,
          request_started_at,
          created_at
        FROM facilitator_invocations
        WHERE facilitator_name = {facilitatorName: String}
          AND created_at >= toDateTime({start: String})
          AND created_at <= toDateTime({end: String})
          ${statusCondition}
          ${methodCondition}
        ORDER BY created_at DESC
        LIMIT {pageSize: UInt32}
        OFFSET {offset: UInt32}
      `;

      const dataResultSet = await clickhouse.query({
        query: dataQuery,
        format: 'JSONEachRow',
        query_params: {
          facilitatorName,
          start: start.toISOString().replace('T', ' ').split('.')[0],
          end: end.toISOString().replace('T', ' ').split('.')[0],
          pageSize,
          offset,
          ...(methodFilter && { methodFilter }),
        },
      });

      const data = await dataResultSet.json();

      return {
        data: data as Array<{
          request_id: string;
          event_type: string;
          method: string;
          status_code: number | null;
          duration: number | null;
          error_type: string | null;
          error_message_json: unknown;
          response_headers_json: unknown;
          metadata: unknown;
          client_ip: string | null;
          user_agent: string | null;
          payment_payload_json: unknown;
          payment_requirements_json: unknown;
          request_started_at: string;
          created_at: string;
        }>,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),
});
