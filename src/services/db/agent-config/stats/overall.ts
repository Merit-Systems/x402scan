import z from 'zod';

import { subMonths, differenceInMilliseconds, getUnixTime } from 'date-fns';

import { queryRaw } from '../../query';
import { Prisma } from '@prisma/client';

export const overallActivityInputSchema = z.object({
  startDate: z
    .date()
    .optional()
    .default(() => subMonths(new Date(), 1)),
  endDate: z
    .date()
    .optional()
    .default(() => new Date()),
});

export const getOverallActivity = async (
  input: z.infer<typeof overallActivityInputSchema>
) => {
  const { startDate, endDate } = input;
  const [result] = await queryRaw(
    Prisma.sql`
      SELECT
        COUNT(DISTINCT c."userId") AS user_count,
        COUNT(DISTINCT acu."agentConfigurationId") AS agent_count,
        COALESCE((SELECT COUNT(*) FROM "Message"), 0) AS message_count,
        COALESCE((SELECT COUNT(*) FROM "ToolCall"), 0) AS tool_call_count
      FROM "Chat" c
      LEFT JOIN "AgentUser" acu ON c."userAgentConfigurationId" = acu.id
      WHERE c."createdAt" >= ${startDate}
      AND c."createdAt" <= ${endDate}
    `,
    z.array(
      z.object({
        user_count: z.bigint(),
        agent_count: z.bigint(),
        message_count: z.bigint(),
        tool_call_count: z.bigint(),
      })
    )
  );

  return result;
};

export const overallBucketedActivityInputSchema = z.object({
  startDate: z.date().optional(),
  endDate: z
    .date()
    .optional()
    .default(() => new Date()),
  numBuckets: z.number().optional().default(48),
});

export const getOverallBucketedActivity = async (
  input: z.infer<typeof overallBucketedActivityInputSchema>
) => {
  const { endDate, numBuckets } = input;

  const startDate = input.startDate ?? subMonths(new Date(), 1);

  // Calculate bucket size in seconds for consistent alignment using date-fns
  const timeRangeMs = differenceInMilliseconds(endDate, startDate);
  const bucketSizeMs = Math.floor(timeRangeMs / numBuckets);
  const bucketSizeSeconds = Math.max(1, Math.floor(bucketSizeMs / 1000)); // Ensure at least 1 second

  // Calculate the first bucket start time aligned to the bucket size using date-fns
  const startTimestamp = getUnixTime(startDate);
  const firstBucketStartTimestamp =
    Math.floor(startTimestamp / bucketSizeSeconds) * bucketSizeSeconds;

  const sql = Prisma.sql`
    WITH time_buckets AS (
      SELECT 
        generate_series(
          ${firstBucketStartTimestamp}::bigint,
          ${Math.floor(endDate.getTime() / 1000)}::bigint,
          ${bucketSizeSeconds}::bigint
        ) AS bucket_start_timestamp
    ),
    message_data AS (
      SELECT
        tb.bucket_start_timestamp,
        COALESCE(COUNT(DISTINCT c."userId"), 0) AS unique_users,
        COALESCE(COUNT(m."Message"), 0) AS total_messages
      FROM time_buckets tb
      LEFT JOIN "Chat" c ON EXTRACT(EPOCH FROM DATE_TRUNC('second', c."createdAt"))::bigint / ${bucketSizeSeconds} * ${bucketSizeSeconds} = tb.bucket_start_timestamp
      LEFT JOIN "Message" m ON c.id = m."chatId" 
        AND m."createdAt" >= ${startDate} 
        AND m."createdAt" <= ${endDate}
      GROUP BY tb.bucket_start_timestamp
    ),
    tool_call_data AS (
      SELECT
        tb.bucket_start_timestamp,
        COALESCE(COUNT(tc.id), 0) AS total_tool_calls
      FROM time_buckets tb
      LEFT JOIN "Chat" c ON EXTRACT(EPOCH FROM DATE_TRUNC('second', c."createdAt"))::bigint / ${bucketSizeSeconds} * ${bucketSizeSeconds} = tb.bucket_start_timestamp
      LEFT JOIN "ToolCall" tc ON c.id = tc."chatId"
        AND tc."createdAt" >= ${startDate}
        AND tc."createdAt" <= ${endDate}
      GROUP BY tb.bucket_start_timestamp
    ),
    active_agents_data AS (
      SELECT
        tb.bucket_start_timestamp,
        COALESCE(COUNT(DISTINCT acu."agentConfigurationId"), 0) AS active_agents
      FROM time_buckets tb
      LEFT JOIN "Chat" c ON EXTRACT(EPOCH FROM DATE_TRUNC('second', c."createdAt"))::bigint / ${bucketSizeSeconds} * ${bucketSizeSeconds} = tb.bucket_start_timestamp
      LEFT JOIN "AgentUser" acu ON c."userAgentConfigurationId" = acu.id
      LEFT JOIN "Message" m ON c.id = m."chatId"
        AND m."createdAt" >= ${startDate}
        AND m."createdAt" <= ${endDate}
      WHERE m."Message" IS NOT NULL
      GROUP BY tb.bucket_start_timestamp
    )
    SELECT
      to_timestamp(tb.bucket_start_timestamp) AS bucket_start,
      COALESCE(md.unique_users, 0) AS unique_users,
      COALESCE(md.total_messages, 0) AS total_messages,
      COALESCE(tcd.total_tool_calls, 0) AS total_tool_calls,
      COALESCE(aad.active_agents, 0) AS active_agents
    FROM time_buckets tb
    LEFT JOIN message_data md ON tb.bucket_start_timestamp = md.bucket_start_timestamp
    LEFT JOIN tool_call_data tcd ON tb.bucket_start_timestamp = tcd.bucket_start_timestamp
    LEFT JOIN active_agents_data aad ON tb.bucket_start_timestamp = aad.bucket_start_timestamp
    ORDER BY tb.bucket_start_timestamp ASC
  `;

  return queryRaw(
    sql,
    z.array(
      z.object({
        bucket_start: z.coerce.date(),
        unique_users: z.coerce.number(),
        total_messages: z.coerce.number(),
        total_tool_calls: z.coerce.number(),
        active_agents: z.coerce.number(),
      })
    )
  );
};
