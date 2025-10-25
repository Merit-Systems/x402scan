import z from 'zod';

import { queryRaw } from '../query';

import { Prisma } from '@prisma/client';
import { sortingSchema } from '@/lib/schemas';
import type { PaginatedQueryParams } from '@/lib/pagination';
import { paginationClause, toPaginatedResponse } from '@/lib/pagination';
import { prisma } from '../client';

const agentsSortingIds = [
  'message_count',
  'tool_call_count',
  'user_count',
  'chat_count',
  'createdAt',
] as const;

export type AgentSortId = (typeof agentsSortingIds)[number];

export const listTopAgentConfigurationsSchema = z.object({
  userId: z.string().optional(),
  sorting: sortingSchema(agentsSortingIds).default({
    id: 'message_count',
    desc: true,
  }),
});

export const listTopAgentConfigurations = async (
  input: z.infer<typeof listTopAgentConfigurationsSchema>,
  pagination: PaginatedQueryParams
) => {
  const { sorting, userId } = input;

  const [count, items] = await Promise.all([
    prisma.agentConfiguration.count({
      where: {
        visibility: 'public',
      },
    }),
    queryRaw(
      Prisma.sql`
      SELECT 
        ac.id,
        ac.name,
        ac.description,
        ac.image,
        ac."systemPrompt",
        ac.visibility,
        ac."createdAt",
        COUNT(DISTINCT au."userId") AS user_count,
        COUNT(DISTINCT ch.id) AS chat_count,
        COALESCE(m.message_count, 0) AS message_count,
        COALESCE(tc.tool_call_count, 0) AS tool_call_count,
        -- JSON aggregate of tools/resources with origin favicon and id
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', r.id,
              'originFavicon', o.favicon
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) AS resources
      FROM "AgentConfiguration" ac
      LEFT JOIN "AgentUser" au ON au."agentConfigurationId" = ac.id
      LEFT JOIN "Chat" ch ON ch."userAgentConfigurationId" = au.id
      LEFT JOIN (
        SELECT acu."agentConfigurationId", COUNT(m."Message") AS message_count
        FROM "Chat" c
        LEFT JOIN "AgentUser" acu ON c."userAgentConfigurationId" = acu.id
        LEFT JOIN "Message" m ON c.id = m."chatId"
        WHERE c."userAgentConfigurationId" IS NOT NULL
        GROUP BY acu."agentConfigurationId"
      ) m ON m."agentConfigurationId" = ac.id
      LEFT JOIN (
        SELECT acu."agentConfigurationId", COUNT(tc.id) AS tool_call_count
        FROM "Chat" c
        LEFT JOIN "AgentUser" acu ON c."userAgentConfigurationId" = acu.id
        LEFT JOIN "ToolCall" tc ON c.id = tc."chatId"
        WHERE c."userAgentConfigurationId" IS NOT NULL
        GROUP BY acu."agentConfigurationId"
      ) tc ON tc."agentConfigurationId" = ac.id
      -- Join to tools/resources related to the AgentConfiguration
      LEFT JOIN "AgentConfigurationResource" acr ON acr."agentConfigurationId" = ac.id
      LEFT JOIN "Resources" r ON acr."resourceId" = r.id
      LEFT JOIN "ResourceOrigin" o ON r."originId" = o.id
      WHERE ${userId ? Prisma.sql`au."userId" = ${userId}` : Prisma.sql`ac.visibility = 'public'`}
      GROUP BY 
        ac.id, ac.name, ac.description, ac.image, ac."systemPrompt", ac.visibility, ac."createdAt", m.message_count, tc.tool_call_count
      ORDER BY 
        ${
          sorting.id === 'message_count'
            ? Prisma.sql`message_count`
            : sorting.id === 'tool_call_count'
              ? Prisma.sql`tool_call_count`
              : sorting.id === 'user_count'
                ? Prisma.sql`user_count`
                : sorting.id === 'chat_count'
                  ? Prisma.sql`chat_count`
                  : Prisma.sql`createdAt`
        } ${sorting.desc ? Prisma.sql`DESC` : Prisma.sql`ASC`}
      ${paginationClause(pagination)}
    `,
      z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          image: z.string().nullable(),
          systemPrompt: z.string(),
          visibility: z.enum(['public', 'private']),
          createdAt: z.date(),
          user_count: z.bigint(),
          chat_count: z.bigint(),
          message_count: z.bigint(),
          tool_call_count: z.bigint(),
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
