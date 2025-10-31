import z from 'zod';

import { queryRaw } from '../query';

import { Prisma } from '@prisma/client';
import { sortingSchema } from '@/lib/schemas';
import type { PaginatedQueryParams } from '@/lib/pagination';
import { paginationClause, toPaginatedResponse } from '@/lib/pagination';
import { prisma } from '../client';

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
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  userId: z.string().optional(),
  originId: z.string().optional(),
  sorting: sortingSchema(agentsSortingIds).default({
    id: 'score',
    desc: true,
  }),
});

export const listTopAgentConfigurations = async (
  input: z.infer<typeof listTopAgentConfigurationsSchema>,
  pagination: PaginatedQueryParams
) => {
  const { sorting, userId, originId, startDate, endDate } = input;

  const [count, items] = await Promise.all([
    prisma.agentConfiguration.count({
      where: {
        visibility: 'public',
        ...(originId
          ? { resources: { some: { resource: { originId } } } }
          : {}),
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
        COALESCE(u.user_count, 0) AS user_count,
        COUNT(DISTINCT ch.id) AS chat_count,
        COALESCE(m.message_count, 0) AS message_count,
        COALESCE(tc.tool_call_count, 0) AS tool_call_count,
        (GREATEST(COALESCE(m.message_count, 0), 1) * GREATEST(COALESCE(tc.tool_call_count, 0), 1) * GREATEST(COALESCE(u.user_count, 0), 1)) AS score,
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
        SELECT acu."agentConfigurationId", COUNT(DISTINCT acu."userId") AS user_count
        FROM "Chat" c
        LEFT JOIN "AgentUser" acu ON c."userAgentConfigurationId" = acu.id
        LEFT JOIN "Message" m ON c.id = m."chatId"
        WHERE c."userAgentConfigurationId" IS NOT NULL
          AND m.role = 'assistant'
          ${startDate ? Prisma.sql`AND m."createdAt" >= ${startDate}` : Prisma.sql``}
          ${endDate ? Prisma.sql`AND m."createdAt" <= ${endDate}` : Prisma.sql``}
        GROUP BY acu."agentConfigurationId"
      ) u ON u."agentConfigurationId" = ac.id
      LEFT JOIN (
        SELECT acu."agentConfigurationId", COUNT(m."Message") AS message_count
        FROM "Chat" c
        LEFT JOIN "AgentUser" acu ON c."userAgentConfigurationId" = acu.id
        LEFT JOIN "Message" m ON c.id = m."chatId"
        WHERE c."userAgentConfigurationId" IS NOT NULL
          AND m.role = 'assistant'
          ${startDate ? Prisma.sql`AND m."createdAt" >= ${startDate}` : Prisma.sql``}
          ${endDate ? Prisma.sql`AND m."createdAt" <= ${endDate}` : Prisma.sql``}
        GROUP BY acu."agentConfigurationId"
      ) m ON m."agentConfigurationId" = ac.id
      LEFT JOIN (
        SELECT acu."agentConfigurationId", COUNT(tc.id) AS tool_call_count
        FROM "Chat" c
        LEFT JOIN "AgentUser" acu ON c."userAgentConfigurationId" = acu.id
        LEFT JOIN "ToolCall" tc ON c.id = tc."chatId"
        WHERE c."userAgentConfigurationId" IS NOT NULL
          ${startDate ? Prisma.sql`AND tc."createdAt" >= ${startDate}` : Prisma.sql``}
          ${endDate ? Prisma.sql`AND tc."createdAt" <= ${endDate}` : Prisma.sql``}
        GROUP BY acu."agentConfigurationId"
      ) tc ON tc."agentConfigurationId" = ac.id
      -- Join to tools/resources related to the AgentConfiguration
      LEFT JOIN "AgentConfigurationResource" acr ON acr."agentConfigurationId" = ac.id
      LEFT JOIN "Resources" r ON acr."resourceId" = r.id
      LEFT JOIN "ResourceOrigin" o ON r."originId" = o.id
      WHERE 1=1
        ${userId ? Prisma.sql`AND au."userId" = ${userId}` : Prisma.sql`AND ac.visibility = 'public'`}
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
      GROUP BY 
        ac.id, ac.name, ac.description, ac.image, ac."systemPrompt", ac.visibility, ac."createdAt", u.user_count, m.message_count, tc.tool_call_count
      ORDER BY ${Prisma.raw(`"${sorting.id}"`)} ${sorting.desc ? Prisma.sql`DESC` : Prisma.sql`ASC`}
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
