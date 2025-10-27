import z from 'zod';
import { queryRaw } from '../query';
import { Prisma } from '@prisma/client';
import type { PaginatedQueryParams } from '@/lib/pagination';
import { paginationClause, toPaginatedResponse } from '@/lib/pagination';
import { prisma } from '../client';

const agentConfigurationSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    image: z.url().nullable(),
  })
  .nullable();

const resourceSchema = z.object({
  id: z.string(),
  resource: z.string(),
  favicon: z.url().nullable(),
});

// Discriminated union for feed events
const messageEventSchema = z.object({
  type: z.literal('message'),
  createdAt: z.date(),
  resource: resourceSchema.nullable(),
  agentConfiguration: agentConfigurationSchema,
});

const toolCallEventSchema = z.object({
  type: z.literal('tool_call'),
  createdAt: z.date(),
  resource: resourceSchema,
  agentConfiguration: agentConfigurationSchema,
});

const feedEventSchema = z.discriminatedUnion('type', [
  messageEventSchema,
  toolCallEventSchema,
]);

export const getAgentConfigFeedSchema = z.object({
  agentConfigurationId: z.string().optional(),
  userId: z.string().optional(),
});

export const getAgentConfigFeed = async (
  input: z.infer<typeof getAgentConfigFeedSchema>,
  pagination: PaginatedQueryParams
) => {
  const { agentConfigurationId, userId } = input;

  const [items, toolCallCount, messageCount] = await Promise.all([
    queryRaw(
      Prisma.sql`
      WITH message_events AS (
        SELECT 
          'message' as type,
          m."createdAt",
          NULL::json as resource,
          CASE 
            WHEN acu."agentConfigurationId" IS NULL THEN NULL
            ELSE json_build_object(
              'id', acu."agentConfigurationId",
              'name', ac.name,
              'image', ac.image
            )
          END as "agentConfiguration"
        FROM "Message" m
        JOIN "Chat" c ON m."chatId" = c.id
        LEFT JOIN "AgentUser" acu ON c."userAgentConfigurationId" = acu.id
        LEFT JOIN "AgentConfiguration" ac ON acu."agentConfigurationId" = ac.id
        WHERE m.role = 'user'
          ${agentConfigurationId ? Prisma.sql`AND acu."agentConfigurationId" = ${agentConfigurationId}` : Prisma.sql``}
          ${userId ? Prisma.sql`AND c."userId" = ${userId}` : Prisma.sql``}
      ),
      tool_call_events AS (
        SELECT 
          'tool_call' as type,
          tc."createdAt",
          json_build_object(
            'id', r.id,
            'resource', r.resource,
            'favicon', ro.favicon
          ) as "resource",
          CASE 
            WHEN acu."agentConfigurationId" IS NULL THEN NULL
            ELSE json_build_object(
              'id', acu."agentConfigurationId",
              'name', ac.name,
              'image', ac.image
            )
          END as "agentConfiguration"
        FROM "ToolCall" tc
        JOIN "Chat" c ON tc."chatId" = c.id
        JOIN "Resources" r ON tc."resourceId" = r.id
        LEFT JOIN "ResourceOrigin" ro ON r."originId" = ro.id
        LEFT JOIN "AgentUser" acu ON c."userAgentConfigurationId" = acu.id
        LEFT JOIN "AgentConfiguration" ac ON acu."agentConfigurationId" = ac.id
        WHERE 1=1
          ${agentConfigurationId ? Prisma.sql`AND acu."agentConfigurationId" = ${agentConfigurationId}` : Prisma.sql``}
          ${userId ? Prisma.sql`AND c."userId" = ${userId}` : Prisma.sql``}
      ),
      combined_events AS (
        SELECT * FROM message_events
        UNION ALL
        SELECT * FROM tool_call_events
      )
      SELECT * FROM combined_events
      ORDER BY "createdAt" DESC
      ${paginationClause(pagination)}
      `,
      z.array(feedEventSchema)
    ),
    prisma.toolCall.count({
      where: {
        chat: {
          userAgentConfiguration: {
            agentConfigurationId: agentConfigurationId,
          },
          userId: userId,
        },
      },
    }),
    prisma.message.count({
      where: {
        chat: {
          userAgentConfiguration: {
            agentConfigurationId: agentConfigurationId,
          },
          userId: userId,
        },
        role: 'user',
      },
    }),
  ]);

  return toPaginatedResponse({
    items,
    total_count: toolCallCount + messageCount,
    ...pagination,
  });
};
