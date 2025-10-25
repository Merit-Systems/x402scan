import z from 'zod';
import { prisma } from '../client';
import { queryRaw } from '../query';

import { Prisma } from '@prisma/client';
import { sortingSchema } from '@/lib/schemas';
import type { PaginatedQueryParams } from '@/lib/pagination';
import { paginationClause, toPaginatedResponse } from '@/lib/pagination';

export const createToolCall = async (data: Prisma.ToolCallCreateInput) => {
  return await prisma.toolCall.create({
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

export const listTopTools = async (
  input: z.infer<typeof listTopToolsSchema>,
  pagination: PaginatedQueryParams
) => {
  const { sorting } = input;
  const [count, items] = await Promise.all([
    prisma.resources.count({
      where: {
        toolCalls: {
          some: {},
        },
      },
    }),
    queryRaw(
      Prisma.sql`
    WITH resource_stats AS (
      SELECT 
        r.id,
        r.resource,
        r.type,
        r."x402Version",
        r."lastUpdated",
        r.metadata,
        r."originId",
        -- Origin data
        ro.id as origin_id,
        ro.origin as origin_origin,
        ro.title as origin_title,
        ro.description as origin_description,
        ro.favicon as origin_favicon,
        ro."createdAt" as origin_created_at,
        ro."updatedAt" as origin_updated_at,
        -- Statistics
        COUNT(DISTINCT tc.id) as tool_calls,
        COUNT(DISTINCT acr.id) as agent_configurations,
        COUNT(DISTINCT c."userId") as unique_users,
        MAX(tc."createdAt") as latest_call_time
      FROM "Resources" r
      LEFT JOIN "ResourceOrigin" ro ON r."originId" = ro.id
      LEFT JOIN "ToolCall" tc ON r.id = tc."resourceId"
      LEFT JOIN "Chat" c ON tc."chatId" = c.id
      LEFT JOIN "AgentConfigurationResource" acr ON r.id = acr."resourceId"
      GROUP BY r.id, r.resource, r.type, r."x402Version", r."lastUpdated", r.metadata, r."originId",
               ro.id, ro.origin, ro.title, ro.description, ro.favicon, ro."createdAt", ro."updatedAt"
    )
    SELECT 
      rs.id,
      rs.resource,
      rs.tool_calls,
      rs.agent_configurations,
      rs.unique_users,
      rs.latest_call_time,
      -- Origin data as nested JSON object
      json_build_object(
        'id', rs.origin_id,
        'origin', rs.origin_origin,
        'favicon', rs.origin_favicon
      ) as origin,
      -- Accepts data as JSON array
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
          WHERE a."resourceId" = rs.id
        ),
        '[]'::json
      ) as accepts
    FROM resource_stats rs
    WHERE ${
      sorting.id === 'latestCallTime'
        ? Prisma.sql`latest_call_time IS NOT NULL`
        : sorting.id === 'toolCalls'
          ? Prisma.sql`tool_calls > 0`
          : sorting.id === 'agentConfigurations'
            ? Prisma.sql`agent_configurations > 0`
            : Prisma.sql`unique_users > 0`
    }
    ORDER BY 
      ${
        sorting.id === 'toolCalls'
          ? Prisma.sql`tool_calls`
          : sorting.id === 'agentConfigurations'
            ? Prisma.sql`agent_configurations`
            : sorting.id === 'uniqueUsers'
              ? Prisma.sql`unique_users`
              : Prisma.sql`latest_call_time`
      } ${sorting.desc ? Prisma.sql`DESC` : Prisma.sql`ASC`}
    ${paginationClause(pagination)}
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
