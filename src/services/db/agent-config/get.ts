import z from 'zod';

import { queryRaw } from '../query';

import { Prisma } from '@prisma/client';
import { prisma } from '../client';

export const getAgentConfigurationDetails = async (id: string) => {
  const agentConfiguration = await prisma.agentConfiguration.findUnique({
    where: { id },
    select: {
      name: true,
      description: true,
      systemPrompt: true,
    },
  });
  return agentConfiguration;
};

export const getAgentConfiguration = async (id: string, userId?: string) => {
  const [agentConfiguration] = await queryRaw(
    Prisma.sql`
    SELECT 
      ac.id,
      ac.name,
      ac.description,
      ac.image,
      ac."systemPrompt",
      ac.visibility,
      ac."createdAt",
      ac."updatedAt",
      ac."ownerId",
      ac.model,
      ac."starterPrompts",
      COALESCE(user_counts.user_count, 0) as "userCount",
      COALESCE(message_counts.message_count, 0) as "messageCount",
      COALESCE(tool_call_counts.tool_call_count, 0) as "toolCallCount",
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'id', r.id,
            'resource', r.resource,
            'favicon', o.favicon,
            'usageCount', COALESCE(resource_usage_counts.usage_count, 0),
            'accepts', (
              SELECT JSON_AGG(
                JSONB_BUILD_OBJECT(
                  'description', a2.description,
                  'maxAmountRequired', a2."maxAmountRequired"
                )
              )
              FROM "Accepts" a2
              WHERE a2."resourceId" = r.id
            )
          )
        ) FILTER (WHERE r.id IS NOT NULL),
        '[]'
      ) AS resources
    FROM "AgentConfiguration" ac
    LEFT JOIN (
      SELECT 
        "agentConfigurationId",
        COUNT(*) as user_count
      FROM "AgentUser"
      GROUP BY "agentConfigurationId"
    ) user_counts ON ac.id = user_counts."agentConfigurationId"
    LEFT JOIN (
      SELECT 
        acu."agentConfigurationId",
        COUNT(m."Message") as message_count
      FROM "Chat" c
      LEFT JOIN "AgentUser" acu ON c."userAgentConfigurationId" = acu.id
      LEFT JOIN "Message" m ON c.id = m."chatId"
      WHERE c."userAgentConfigurationId" IS NOT NULL
      GROUP BY acu."agentConfigurationId"
    ) message_counts ON ac.id = message_counts."agentConfigurationId"
    LEFT JOIN (
      SELECT 
        acu."agentConfigurationId",
        COUNT(tc.id) as tool_call_count
      FROM "Chat" c
      LEFT JOIN "AgentUser" acu ON c."userAgentConfigurationId" = acu.id
      LEFT JOIN "ToolCall" tc ON c.id = tc."chatId"
      WHERE c."userAgentConfigurationId" IS NOT NULL
      GROUP BY acu."agentConfigurationId"
    ) tool_call_counts ON ac.id = tool_call_counts."agentConfigurationId"
    LEFT JOIN "AgentConfigurationResource" acr ON acr."agentConfigurationId" = ac.id
    LEFT JOIN "Resources" r ON acr."resourceId" = r.id
    LEFT JOIN "ResourceOrigin" o ON r."originId" = o.id
    LEFT JOIN (
      SELECT 
        tc."resourceId",
        COUNT(tc.id) as usage_count
      FROM "ToolCall" tc
      LEFT JOIN "Chat" c ON tc."chatId" = c.id
      LEFT JOIN "AgentUser" acu ON c."userAgentConfigurationId" = acu.id
      WHERE c."userAgentConfigurationId" IS NOT NULL
      GROUP BY tc."resourceId"
    ) resource_usage_counts ON r.id = resource_usage_counts."resourceId"
    WHERE ac.id = ${id}
    AND (
      ac."ownerId" = ${userId} 
      OR EXISTS (
        SELECT 1 FROM "AgentUser" au 
        WHERE au."agentConfigurationId" = ac.id 
        AND au."userId" = ${userId}
      ) 
      OR ac.visibility = 'public'
    )
    GROUP BY
      ac.id,
      ac.name,
      ac.description,
      ac.image,
      ac."systemPrompt",
      ac.visibility,
      ac."createdAt",
      ac."updatedAt",
      ac.model,
      user_counts.user_count,
      message_counts.message_count,
      tool_call_counts.tool_call_count
  `,
    z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        ownerId: z.string(),
        description: z.string().nullable(),
        image: z.string().nullable(),
        systemPrompt: z.string(),
        visibility: z.enum(['public', 'private']),
        createdAt: z.date(),
        updatedAt: z.date(),
        model: z.string().nullable(),
        starterPrompts: z.array(z.string()),
        userCount: z.bigint(),
        messageCount: z.bigint(),
        toolCallCount: z.bigint(),
        resources: z.array(
          z.object({
            id: z.string(),
            resource: z.string(),
            favicon: z.url().nullable(),
            usageCount: z.number(),
            accepts: z.array(
              z.object({
                description: z.string(),
                maxAmountRequired: z.number(),
              })
            ),
          })
        ),
      })
    )
  );

  return agentConfiguration;
};
