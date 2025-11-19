import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/trpc/trpc';
import { analyticsDb } from '@x402scan/analytics-db';

export const observabilityRouter = createTRPCRouter({
  statusCodes: publicProcedure
    .input(
      z.object({
        originUrl: z.string(),
        resourceUrl: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        bucketMinutes: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { originUrl, resourceUrl, startDate, endDate, bucketMinutes } =
        input;

      const start = new Date(startDate);
      const end = new Date(endDate);

      const query = `
        SELECT
          toStartOfInterval(created_at, INTERVAL {bucketMinutes: UInt32} MINUTE) AS ts,
          countIf(status_code >= 200 AND status_code < 300) AS r_2xx,
          countIf(status_code >= 300 AND status_code < 400) AS r_3xx,
          countIf(status_code >= 400 AND status_code < 500) AS r_4xx,
          countIf(status_code >= 500) AS r_5xx
        FROM resource_invocations
        WHERE created_at >= toDateTime({start: String})
          AND created_at <= toDateTime({end: String})
          AND (url = {url: String} OR url LIKE {urlPattern: String})
        GROUP BY ts
        ORDER BY ts ASC
      `;

      const resultSet = await analyticsDb.query({
        query,
        format: 'JSONEachRow',
        query_params: {
          start: start.toISOString().replace('T', ' ').split('.')[0],
          end: end.toISOString().replace('T', ' ').split('.')[0],
          bucketMinutes,
          url: resourceUrl ?? '',
          urlPattern: `%${originUrl}%`,
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
        originUrl: z.string(),
        resourceUrl: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        bucketMinutes: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { originUrl, resourceUrl, startDate, endDate, bucketMinutes } =
        input;

      const start = new Date(startDate);
      const end = new Date(endDate);

      const query = `
        SELECT
          toStartOfInterval(created_at, INTERVAL {bucketMinutes: UInt32} MINUTE) AS ts,
          count() AS total_requests,
          countIf(status_code >= 500) AS error_requests,
          (countIf(status_code >= 500) * 100.0 / count()) AS error_rate
        FROM resource_invocations
        WHERE created_at >= toDateTime({start: String})
          AND created_at <= toDateTime({end: String})
          AND (url = {url: String} OR url LIKE {urlPattern: String})
        GROUP BY ts
        ORDER BY ts ASC
      `;

      const resultSet = await analyticsDb.query({
        query,
        format: 'JSONEachRow',
        query_params: {
          start: start.toISOString().replace('T', ' ').split('.')[0],
          end: end.toISOString().replace('T', ' ').split('.')[0],
          bucketMinutes,
          url: resourceUrl ?? '',
          urlPattern: `%${originUrl}%`,
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
        originUrl: z.string(),
        resourceUrl: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        bucketMinutes: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { resourceUrl, startDate, endDate, bucketMinutes } = input;

      const start = new Date(startDate);
      const end = new Date(endDate);

      const query = `
        SELECT
          toStartOfInterval(created_at, INTERVAL {bucketMinutes: UInt32} MINUTE) AS ts,
          quantile(0.5)(duration) AS p50,
          quantile(0.9)(duration) AS p90,
          quantile(0.99)(duration) AS p99
        FROM resource_invocations
        WHERE created_at >= toDateTime({start: String})
          AND created_at <= toDateTime({end: String})
          AND url = {url: String}
        GROUP BY ts
        ORDER BY ts ASC
      `;

      const resultSet = await analyticsDb.query({
        query,
        format: 'JSONEachRow',
        query_params: {
          start: start.toISOString().replace('T', ' ').split('.')[0],
          end: end.toISOString().replace('T', ' ').split('.')[0],
          bucketMinutes,
          url: resourceUrl,
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

  resources: publicProcedure
    .input(
      z.object({
        originUrl: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { originUrl, startDate, endDate } = input;

      const start = new Date(startDate);
      const end = new Date(endDate);

      const query = `
        SELECT
          url,
          count() AS total_requests,
          countIf(status_code >= 400) AS error_count,
          avg(duration) AS avg_duration,
          max(created_at) AS last_seen
        FROM resource_invocations
        WHERE created_at >= toDateTime({start: String})
          AND created_at <= toDateTime({end: String})
          AND url LIKE {urlPattern: String}
        GROUP BY url
        ORDER BY total_requests DESC
        LIMIT 100
      `;

      const resultSet = await analyticsDb.query({
        query,
        format: 'JSONEachRow',
        query_params: {
          start: start.toISOString().replace('T', ' ').split('.')[0],
          end: end.toISOString().replace('T', ' ').split('.')[0],
          urlPattern: `%${originUrl}%`,
        },
      });

      const data = await resultSet.json();
      return data as Array<{
        url: string;
        total_requests: string;
        error_count: string;
        avg_duration: string;
        last_seen: string;
      }>;
    }),

  invocations: publicProcedure
    .input(
      z.object({
        resourceUrl: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        page: z.number().default(1),
        pageSize: z.number().default(50),
        statusFilter: z.string().default('5xx'),
      })
    )
    .query(async ({ input }) => {
      const { resourceUrl, startDate, endDate, page, pageSize, statusFilter } =
        input;

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

      const countQuery = `
        SELECT count() AS total
        FROM resource_invocations
        WHERE created_at >= toDateTime({start: String})
          AND created_at <= toDateTime({end: String})
          AND url = {resourceUrl: String}
          ${statusCondition}
      `;

      const countResultSet = await analyticsDb.query({
        query: countQuery,
        format: 'JSONEachRow',
        query_params: {
          start: start.toISOString().replace('T', ' ').split('.')[0],
          end: end.toISOString().replace('T', ' ').split('.')[0],
          resourceUrl,
        },
      });

      const countData = await countResultSet.json();
      const totalStr = (countData as Array<{ total: string }>)[0]?.total ?? '0';
      const total = parseInt(totalStr);

      const dataQuery = `
        SELECT
          id,
          url,
          method,
          status_code,
          status_text,
          duration,
          created_at,
          request_content_type,
          response_content_type,
          response_body
        FROM resource_invocations
        WHERE created_at >= toDateTime({start: String})
          AND created_at <= toDateTime({end: String})
          AND url = {resourceUrl: String}
          ${statusCondition}
        ORDER BY created_at DESC
        LIMIT {pageSize: UInt32}
        OFFSET {offset: UInt32}
      `;

      const dataResultSet = await analyticsDb.query({
        query: dataQuery,
        format: 'JSONEachRow',
        query_params: {
          start: start.toISOString().replace('T', ' ').split('.')[0],
          end: end.toISOString().replace('T', ' ').split('.')[0],
          resourceUrl,
          pageSize,
          offset,
        },
      });

      const data = await dataResultSet.json();

      return {
        data: data as Array<{
          id: string;
          url: string;
          method: string;
          status_code: number;
          status_text: string;
          duration: number;
          created_at: string;
          request_content_type: string;
          response_content_type: string;
          response_body: string;
        }>,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),
});
