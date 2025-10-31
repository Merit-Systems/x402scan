import z from 'zod';

import { subMonths, differenceInMilliseconds, getUnixTime } from 'date-fns';

import { queryRaw } from '../../query';
import { Prisma } from '@prisma/client';
import { prisma } from '../../client';

export const agentConfigBucketedActivityInputSchema = z.object({
  agentConfigurationId: z.string(),
  startDate: z.date().optional(),
  endDate: z
    .date()
    .optional()
    .default(() => new Date()),
  numBuckets: z.number().optional().default(48),
});

export const getAgentConfigBucketedActivity = async (
  input: z.infer<typeof agentConfigBucketedActivityInputSchema>
) => {
  const { agentConfigurationId, endDate, numBuckets } = input;

  const startDate =
    input.startDate ??
    (
      await prisma.agentConfiguration.findUnique({
        where: { id: agentConfigurationId },
        select: {
          createdAt: true,
        },
      })
    )?.createdAt ??
    subMonths(new Date(), 1);

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
        COALESCE(COUNT(DISTINCT acu."userId"), 0) AS unique_users,
        COALESCE(COUNT(m."Message"), 0) AS total_messages
      FROM time_buckets tb
      LEFT JOIN "Chat" c ON EXTRACT(EPOCH FROM DATE_TRUNC('second', c."createdAt"))::bigint / ${bucketSizeSeconds} * ${bucketSizeSeconds} = tb.bucket_start_timestamp
      LEFT JOIN "AgentUser" acu ON c."userAgentConfigurationId" = acu.id AND acu."agentConfigurationId" = ${agentConfigurationId}
      LEFT JOIN "Message" m ON c.id = m."chatId" 
        AND m."createdAt" >= ${startDate} 
        AND m."createdAt" <= ${endDate}
      WHERE acu."agentConfigurationId" = ${agentConfigurationId}
      GROUP BY tb.bucket_start_timestamp
    ),
    tool_call_data AS (
      SELECT
        tb.bucket_start_timestamp,
        COALESCE(COUNT(tc.id), 0) AS total_tool_calls
      FROM time_buckets tb
      LEFT JOIN "Chat" c ON EXTRACT(EPOCH FROM DATE_TRUNC('second', c."createdAt"))::bigint / ${bucketSizeSeconds} * ${bucketSizeSeconds} = tb.bucket_start_timestamp
      LEFT JOIN "AgentUser" acu ON c."userAgentConfigurationId" = acu.id AND acu."agentConfigurationId" = ${agentConfigurationId}
      LEFT JOIN "ToolCall" tc ON c.id = tc."chatId"
        AND tc."createdAt" >= ${startDate}
        AND tc."createdAt" <= ${endDate}
      WHERE acu."agentConfigurationId" = ${agentConfigurationId}
      GROUP BY tb.bucket_start_timestamp
    )
    SELECT
      to_timestamp(tb.bucket_start_timestamp) AS bucket_start,
      COALESCE(md.unique_users, 0) AS unique_users,
      COALESCE(md.total_messages, 0) AS total_messages,
      COALESCE(tcd.total_tool_calls, 0) AS total_tool_calls
    FROM time_buckets tb
    LEFT JOIN message_data md ON tb.bucket_start_timestamp = md.bucket_start_timestamp
    LEFT JOIN tool_call_data tcd ON tb.bucket_start_timestamp = tcd.bucket_start_timestamp
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
      })
    )
  );
};
