import { after, NextResponse } from 'next/server';

import { z } from 'zod';

import {
  APICallError,
  convertToModelMessages,
  generateText,
  stepCountIs,
  streamText,
  generateId,
} from 'ai';

import { createResumableStreamContext } from 'resumable-stream';

import { toAccount } from 'viem/accounts';

import { createX402OpenAI } from '@merit-systems/ai-x402/server';

import { createChat, getChat, updateChat } from '@/services/db/composer/chat';

import { auth } from '@/auth';

import { createX402AITools } from '@/services/agent/create-tools';

import { messageSchema } from '@/lib/message-schema';

import { getWalletForUserId } from '@/services/cdp/server-wallet/user';
import { ChatSDKError } from '@/lib/errors';
import {
  getUserMessageCount,
  getUserToolCallCount,
} from '@/services/db/user/chat';
import { freeTierConfig } from '@/lib/free-tier';
import { getFreeTierWallet } from '@/services/cdp/server-wallet/free-tier';

import type { NextRequest } from 'next/server';
import type { LanguageModel, UIMessage } from 'ai';
import { getAgentConfigurationDetails } from '@/services/db/agent-config/get';
import {
  agentSystemPrompt,
  baseSystemPrompt,
  freeTierSystemPrompt,
} from './system-prompt';

const bodySchema = z.object({
  model: z.string(),
  resourceIds: z.array(z.uuid()),
  messages: z.array(messageSchema),
  chatId: z.string(),
  agentConfigurationId: z.uuid().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const [messageCount, toolCallCount] = await Promise.all([
    getUserMessageCount(session.user.id),
    getUserToolCallCount(session.user.id),
  ]);

  const requestBody = bodySchema.safeParse(await request.json());

  if (!requestBody.success) {
    console.error('Bad request:', requestBody.error);
    return new ChatSDKError('bad_request:chat').toResponse();
  }

  const { model, resourceIds, messages, chatId, agentConfigurationId } =
    requestBody.data;

  const chat = await getChat(chatId, session.user.id);

  const isFreeTier =
    messageCount < freeTierConfig.numMessages &&
    toolCallCount < freeTierConfig.numToolCalls;

  const wallet = isFreeTier
    ? await getFreeTierWallet()
    : await getWalletForUserId(session.user.id).then(wallet => wallet.wallet);

  if (!wallet) {
    return new ChatSDKError('not_found:chat').toResponse();
  }
  const signer = toAccount(wallet);
  const openai = createX402OpenAI(signer);

  const lastMessage = messages[messages.length - 1];

  if (!chat) {
    // Start title generation in parallel (don't await)
    const titlePromise = generateTitleFromUserMessage({
      message: lastMessage,
      model: openai('gpt-4.1-nano'),
    });

    // Create chat with temporary title immediately
    await createChat({
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
        createMany: {
          data: messages.map(message => ({
            role: message.role,
            parts: JSON.stringify(message.parts),
            attachments: {},
          })),
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
        } catch (error) {
          console.error('Failed to update chat title:', error);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to generate chat title:', error);
      });
  } else {
    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await updateChat(session.user.id, chatId, {
      activeStreamId: null,
      messages: {
        deleteMany: {},
        createMany: {
          data: messages.map(message => ({
            role: message.role,
            parts: JSON.stringify(message.parts),
            attachments: {},
          })),
        },
      },
    });
  }

  const tools = await createX402AITools({
    resourceIds,
    walletClient: signer,
    chatId,
    maxAmount: isFreeTier ? freeTierConfig.maxAmount : undefined,
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
        isFreeTier,
      });
    }
    return isFreeTier ? freeTierSystemPrompt : baseSystemPrompt;
  };

  const result = streamText({
    model: openai.chat(model),
    messages: convertToModelMessages(messages),
    system: await getSystemPrompt(),
    stopWhen: stepCountIs(50),
    tools,
    maxOutputTokens: 10000,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: generateId,
    onFinish: async ({ messages }) => {
      await updateChat(session.user.id, chatId, {
        messages: {
          deleteMany: {},
          createMany: {
            data: messages.map(message => ({
              role: message.role,
              parts: JSON.stringify(message.parts),
              attachments: {},
            })),
          },
        },
      });
    },
    onError: error => {
      if (error instanceof APICallError) {
        if (error.statusCode === 402) {
          return new ChatSDKError('payment_required:chat').message;
        }
      }
      return new ChatSDKError('bad_request:chat').message;
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
  } catch (error) {
    console.error('Error generating title:', error);
    throw new ChatSDKError('server:chat');
  }
}
