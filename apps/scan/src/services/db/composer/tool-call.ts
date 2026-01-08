import z from 'zod';
import { scanDb, Prisma } from '@x402scan/scan-db';
import { queryRaw } from '../query';

import { sortingSchema } from '@/lib/schemas';
import type { PaginatedQueryParams } from '@/lib/pagination';
import { toPaginatedResponse } from '@/lib/pagination';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';

export const createToolCall = async (data: Prisma.ToolCallCreateInput) => {
  return await scanDb.toolCall.create({
    data,
  });
};

const TOOL_SORT_IDS = [
  'toolCalls',
  'agentConfigurations',
  'uniqueUsers',
  'latestCallTime',
] as const;

export type ToolSortId = (typeof TOOL_SORT_IDS)[number];

export const listTopToolsSchema = z.object({
  sorting: sortingSchema(TOOL_SORT_IDS).default({
    id: 'toolCalls',
    desc: true,
  }),
});

const listTopToolsUncached = async (
  input: z.infer<typeof listTopToolsSchema>,
  pagination: PaginatedQueryParams
) => {
  const { sorting } = input;
  const [count, items] = await Promise.all([
    scanDb.resources.count({
      where: {
        toolCalls: {
          some: {},
        },
      },
    }),
    queryRaw(
      Prisma.sql`
    WITH tool_call_stats AS (
      -- Pre-aggregate tool call stats per resource (avoids cartesian explosion)
      SELECT 
        tc."resourceId",
        COUNT(tc.id) AS tool_calls,
        COUNT(DISTINCT c."userId") AS unique_users,
        MAX(tc."createdAt") AS latest_call_time
      FROM "ToolCall" tc
      INNER JOIN "Chat" c ON tc."chatId" = c.id
      WHERE tc."resourceId" IS NOT NULL
      GROUP BY tc."resourceId"
    ),
    agent_config_counts AS (
      -- Pre-aggregate agent config counts per resource (separate to avoid multiply)
      SELECT 
        "resourceId",
        COUNT(*) AS agent_configurations
      FROM "AgentConfigurationResource"
      GROUP BY "resourceId"
    )
    SELECT 
      r.id,
      r.resource,
      COALESCE(tcs.tool_calls, 0) AS tool_calls,
      COALESCE(acc.agent_configurations, 0) AS agent_configurations,
      COALESCE(tcs.unique_users, 0) AS unique_users,
      tcs.latest_call_time,
      -- Origin data as nested JSON object
      json_build_object(
        'id', ro.id,
        'origin', ro.origin,
        'favicon', ro.favicon
      ) as origin,
      -- Accepts data as JSON array (correlated subquery - fast with index)
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', a.id,
              'description', a.description,
              'network', a.network,
              'maxAmountRequired', a."maxAmountRequired",
              'resource', a.resource,
              'payTo', a."payTo"
            )
          )
          FROM "Accepts" a 
          WHERE a."resourceId" = r.id
        ),
        '[]'::json
      ) as accepts
    FROM "Resources" r
    INNER JOIN tool_call_stats tcs ON r.id = tcs."resourceId"
    LEFT JOIN "ResourceOrigin" ro ON r."originId" = ro.id
    LEFT JOIN agent_config_counts acc ON r.id = acc."resourceId"
    WHERE ${
      sorting.id === 'latestCallTime'
        ? Prisma.sql`tcs.latest_call_time IS NOT NULL`
        : sorting.id === 'toolCalls'
          ? Prisma.sql`tcs.tool_calls > 0`
          : sorting.id === 'agentConfigurations'
            ? Prisma.sql`COALESCE(acc.agent_configurations, 0) > 0`
            : Prisma.sql`tcs.unique_users > 0`
    }
    ORDER BY 
      ${
        sorting.id === 'toolCalls'
          ? Prisma.sql`tcs.tool_calls`
          : sorting.id === 'agentConfigurations'
            ? Prisma.sql`acc.agent_configurations`
            : sorting.id === 'uniqueUsers'
              ? Prisma.sql`tcs.unique_users`
              : Prisma.sql`tcs.latest_call_time`
      } ${sorting.desc ? Prisma.sql`DESC` : Prisma.sql`ASC`}
    LIMIT ${pagination.page_size}
    OFFSET ${pagination.page * pagination.page_size}
  `,
      z.array(
        z.object({
          id: z.string(),
          resource: z.string(),
          tool_calls: z.bigint(),
          agent_configurations: z.bigint(),
          unique_users: z.bigint(),
          latest_call_time: z.date().nullable(),
          origin: z.object({
            id: z.string(),
            origin: z.string(),
            favicon: z.string().nullable(),
          }),
          accepts: z.array(
            z.object({
              id: z.string(),
              description: z.string(),
              network: z.string(),
              maxAmountRequired: z.number(),
              payTo: z.string(),
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

export const listTopTools = createCachedPaginatedQuery({
  queryFn: listTopToolsUncached,
  cacheKeyPrefix: 'composer:top-tools',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_call_time'],
  tags: ['composer', 'tools'],
});
