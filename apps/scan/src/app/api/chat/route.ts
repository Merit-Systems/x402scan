import { after, NextResponse } from 'next/server';

import { z } from 'zod';

import {
  APICallError,
  convertToModelMessages,
  generateText,
  stepCountIs,
  streamText,
  generateId,
  createIdGenerator,
} from 'ai';

import { createResumableStreamContext } from 'resumable-stream';

import { createChat, getChat, updateChat } from '@/services/db/composer/chat';

import { auth } from '@/auth';

import { createX402AITools } from '@/services/agent/create-tools';

import { ChatError } from '@/lib/errors';
import { messageSchema } from '@/lib/message-schema';

import { getAgentConfigurationDetails } from '@/services/db/agent-config/get';
import { agentSystemPrompt, baseSystemPrompt } from './system-prompt';

import type { NextRequest } from 'next/server';
import type { LanguageModel, UIMessage } from 'ai';

import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  headers: {
    'HTTP-Referer': 'https://x402scan.com',
    'X-Title': 'x402scan',
  },
});

const bodySchema = z.object({
  model: z.string(),
  resourceIds: z.array(z.uuid()),
  message: messageSchema,
  chatId: z.string(),
  agentConfigurationId: z.uuid().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return new ChatError('unauthorized:auth').toResponse();
  }

  const requestBody = bodySchema.safeParse(await request.json());

  if (!requestBody.success) {
    console.error('Bad request:', requestBody.error);
    return new ChatError('bad_request:chat').toResponse();
  }

  const { model, resourceIds, message, chatId, agentConfigurationId } =
    requestBody.data;

  let chat = await getChat(chatId, session.user.id);

  const lastMessage = message;

  if (!chat) {
    // Start title generation in parallel (don't await)
    const titlePromise = generateTitleFromUserMessage({
      message: lastMessage,
      model: openrouter.chat('gpt-4.1-nano'),
    });

    // Create chat with temporary title immediately
    chat = await createChat({
      id: chatId,
      title: 'New Chat', // Temporary title
      user: {
        connect: { id: session.user.id },
      },
      userAgentConfiguration: agentConfigurationId
        ? {
            connectOrCreate: {
              where: {
                userId_agentConfigurationId: {
                  userId: session.user.id,
                  agentConfigurationId: agentConfigurationId,
                },
              },
              create: {
                userId: session.user.id,
                agentConfigurationId: agentConfigurationId,
              },
            },
          }
        : undefined,
      messages: {
        create: {
          id: message.id,
          role: message.role,
          parts: JSON.stringify(message.parts),
          attachments: {},
        },
      },
    });

    // Update title in the background
    titlePromise
      .then(async generatedTitle => {
        try {
          await updateChat(session.user.id, chatId, {
            title: generatedTitle,
          });
        } catch {
          console.error('Failed to update chat title:');
        }
      })
      .catch(() => {
        console.error('Failed to generate chat title:');
      });
  } else {
    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await updateChat(session.user.id, chatId, {
      activeStreamId: null,
      messages: {
        upsert: {
          where: {
            id: message.id,
          },
          create: {
            id: message.id,
            role: message.role,
            parts: JSON.stringify(message.parts),
            attachments: {},
          },
          update: {
            role: message.role,
            parts: JSON.stringify(message.parts),
            attachments: {},
          },
        },
      },
    });
  }

  const tools = await createX402AITools({
    resourceIds,
    chatId,
    userId: session.user.id,
  });

  const getSystemPrompt = async () => {
    if (agentConfigurationId) {
      const details = await getAgentConfigurationDetails(agentConfigurationId);
      if (!details) {
        return baseSystemPrompt;
      }
      return agentSystemPrompt({
        agentName: details.name,
        agentDescription: details.description ?? '',
        systemPrompt: details.systemPrompt,
      });
    }
    return baseSystemPrompt;
  };

  const messages = z.array(messageSchema).parse([
    ...chat.messages.map(({ parts, ...rest }) => ({
      parts: JSON.parse(parts as string) as unknown,
      ...rest,
    })),
    message,
  ]);

  const result = streamText({
    model: openrouter.chat(model),
    messages: convertToModelMessages(messages),
    system: await getSystemPrompt(),
    stopWhen: stepCountIs(50),
    tools,
    maxOutputTokens: 10000,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: createIdGenerator({
      prefix: 'msg',
      size: 16,
    }),
    onFinish: async ({ responseMessage }) => {
      if (responseMessage.parts.length > 0) {
        await updateChat(session.user.id, chatId, {
          messages: {
            create: {
              id: responseMessage.id,
              role: responseMessage.role,
              parts: JSON.stringify(responseMessage.parts),
              attachments: {},
            },
          },
        });
      }
    },
    onError: error => {
      if (error instanceof APICallError) {
        if (error.statusCode === 402) {
          return new ChatError('payment_required:chat').message;
        }
      }
      if (error instanceof ChatError) {
        return error.message;
      }
      return new ChatError('bad_request:chat').message;
    },
    async consumeSseStream({ stream }) {
      const streamId = generateId();

      // Create a resumable stream from the SSE stream
      const streamContext = createResumableStreamContext({ waitUntil: after });
      await streamContext.createNewResumableStream(streamId, () => stream);

      // Update the chat with the active stream ID
      await updateChat(session.user.id, chatId, {
        id: chatId,
        activeStreamId: streamId,
      });
    },
  });
}

interface GenerateTitleProps {
  message: UIMessage;
  model: LanguageModel;
}

async function generateTitleFromUserMessage({
  message,
  model,
}: GenerateTitleProps) {
  try {
    const { text: title } = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: `\n
      - you will generate a short title in english based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - the title should be in the same language as the user's message
      - the title does not need to be a full sentence, try to pack in the most important information in a few words
      - do not use quotes or colons`,
        },
        ...convertToModelMessages([message]),
      ],
      maxOutputTokens: 100,
    });

    return title;
  } catch {
    console.error('Error generating title:');
    throw new ChatError('server:chat');
  }
}
