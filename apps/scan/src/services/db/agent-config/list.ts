import z from 'zod';

import { scanDb, Prisma } from '@x402scan/scan-db';

import { queryRaw } from '../query';

import { sortingSchema, timeframeSchema } from '@/lib/schemas';
import type { PaginatedQueryParams } from '@/lib/pagination';
import { toPaginatedResponse } from '@/lib/pagination';
import { getTimeRangeFromTimeframe } from '@/lib/time-range';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';

const agentsSortingIds = [
  'score',
  'message_count',
  'tool_call_count',
  'user_count',
  'chat_count',
  'createdAt',
] as const;

export type AgentSortId = (typeof agentsSortingIds)[number];

export const listTopAgentConfigurationsSchema = z.object({
  timeframe: timeframeSchema,
  userId: z.string().optional(),
  originId: z.string().optional(),
  sorting: sortingSchema(agentsSortingIds).default({
    id: 'score',
    desc: true,
  }),
});

const listTopAgentConfigurationsUncached = async (
  input: z.infer<typeof listTopAgentConfigurationsSchema>,
  pagination: PaginatedQueryParams
) => {
  const { sorting, userId, originId, timeframe } = input;
  const { startDate, endDate } = getTimeRangeFromTimeframe(timeframe);

  const [count, items] = await Promise.all([
    scanDb.agentConfiguration.count({
      where: {
        visibility: 'public',
        ...(originId
          ? { resources: { some: { resource: { originId } } } }
          : {}),
      },
    }),
    queryRaw(
      Prisma.sql`
      WITH agent_stats AS (
        -- Single pass: compute all stats per agent configuration
        SELECT 
          acu."agentConfigurationId",
          COUNT(DISTINCT acu."userId") AS user_count,
          COUNT(DISTINCT c.id) AS chat_count,
          COUNT(m."Message") AS message_count,
          COUNT(tc.id) AS tool_call_count
        FROM "AgentUser" acu
        INNER JOIN "Chat" c ON c."userAgentConfigurationId" = acu.id
        LEFT JOIN "Message" m ON c.id = m."chatId" 
          AND m.role = 'assistant'
          ${startDate ? Prisma.sql`AND m."createdAt" >= ${startDate.toISOString()}::timestamp` : Prisma.sql``}
          ${endDate ? Prisma.sql`AND m."createdAt" <= ${endDate.toISOString()}::timestamp` : Prisma.sql``}
        LEFT JOIN "ToolCall" tc ON c.id = tc."chatId"
          ${startDate ? Prisma.sql`AND tc."createdAt" >= ${startDate.toISOString()}::timestamp` : Prisma.sql``}
          ${endDate ? Prisma.sql`AND tc."createdAt" <= ${endDate.toISOString()}::timestamp` : Prisma.sql``}
        WHERE acu."agentConfigurationId" IS NOT NULL
        GROUP BY acu."agentConfigurationId"
      ),
      agent_resources AS (
        -- Separate CTE for resources to avoid cartesian product
        SELECT 
          acr."agentConfigurationId",
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', r.id,
              'originFavicon', o.favicon
            )
          ) FILTER (WHERE r.id IS NOT NULL) AS resources
        FROM "AgentConfigurationResource" acr
        INNER JOIN "Resources" r ON acr."resourceId" = r.id
        LEFT JOIN "ResourceOrigin" o ON r."originId" = o.id
        GROUP BY acr."agentConfigurationId"
      )
      SELECT 
        ac.id,
        ac.name,
        ac.description,
        ac.image,
        ac.visibility,
        ac."createdAt",
        COALESCE(s.user_count, 0) AS user_count,
        COALESCE(s.chat_count, 0) AS chat_count,
        COALESCE(s.message_count, 0) AS message_count,
        COALESCE(s.tool_call_count, 0) AS tool_call_count,
        (GREATEST(COALESCE(s.message_count, 0), 1) * GREATEST(COALESCE(s.tool_call_count, 0), 1) * GREATEST(COALESCE(s.user_count, 0), 1)) AS score,
        COALESCE(ar.resources, '[]') AS resources
      FROM "AgentConfiguration" ac
      LEFT JOIN agent_stats s ON s."agentConfigurationId" = ac.id
      LEFT JOIN agent_resources ar ON ar."agentConfigurationId" = ac.id
      WHERE 1=1
        ${
          userId
            ? Prisma.sql`AND EXISTS (
                SELECT 1 FROM "AgentUser" au 
                WHERE au."agentConfigurationId" = ac.id AND au."userId" = ${userId}
              )`
            : Prisma.sql`AND ac.visibility = 'public'`
        }
        ${
          originId
            ? Prisma.sql`
              AND EXISTS (
                SELECT 1
                FROM "AgentConfigurationResource" acr2
                JOIN "Resources" r2 ON acr2."resourceId" = r2.id
                WHERE acr2."agentConfigurationId" = ac.id
                  AND r2."originId" = ${originId}
              )
            `
            : Prisma.sql``
        }
      ORDER BY ${Prisma.raw(`"${sorting.id}"`)} ${sorting.desc ? Prisma.sql`DESC` : Prisma.sql`ASC`}
      LIMIT ${pagination.page_size}
      OFFSET ${pagination.page * pagination.page_size}
    `,
      z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          image: z.string().nullable(),
          visibility: z.enum(['public', 'private']),
          createdAt: z.date(),
          user_count: z.bigint(),
          chat_count: z.bigint(),
          message_count: z.bigint(),
          tool_call_count: z.bigint(),
          score: z.bigint(),
          resources: z.array(
            z.object({
              id: z.string(),
              originFavicon: z.string().nullable(),
            })
          ),
        })
      )
    ),
  ]);

  return toPaginatedResponse({
    items,
    total_count: count,
    ...pagination,
  });
};

export const listTopAgentConfigurations = createCachedPaginatedQuery({
  queryFn: listTopAgentConfigurationsUncached,
  cacheKeyPrefix: 'agent-config:list',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['createdAt'],
  tags: ['agent-configuration'],
});
