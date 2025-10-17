import { NextResponse } from 'next/server';

import { z } from 'zod';

import type { LanguageModel, UIMessage } from 'ai';
import {
  convertToModelMessages,
  generateText,
  stepCountIs,
  streamText,
} from 'ai';

import { toAccount } from 'viem/accounts';

import { createX402OpenAI } from '@merit-systems/ai-x402/server';

import {
  createChat,
  createMessage,
  getChat,
  updateChat,
} from '@/services/db/chats';

import { auth } from '@/auth';

import { createX402AITools } from '@/services/agent/create-tools';

import { messageSchema } from '@/lib/message-schema';

import type { NextRequest } from 'next/server';
import { getWalletForUserId } from '@/services/cdp/server-wallet';

const bodySchema = z.object({
  model: z.string(),
  resourceIds: z.array(z.uuid()),
  messages: z.array(messageSchema),
  chatId: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requestBody = bodySchema.safeParse(await request.json());

  if (!requestBody.success) {
    console.error(requestBody.error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { model, resourceIds, messages, chatId } = requestBody.data;

  const chat = await getChat(chatId, session.user.id);

  const wallet = await getWalletForUserId(session.user.id);
  if (!wallet) {
    return NextResponse.json(
      { error: 'Server wallet not found' },
      { status: 404 }
    );
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
      messages: {
        create: {
          role: lastMessage.role,
          parts: JSON.stringify(lastMessage.parts),
          attachments: {},
        },
      },
    });

    // Update title in the background
    titlePromise
      .then(async generatedTitle => {
        try {
          await updateChat(session.user.id, {
            id: chatId,
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
    await createMessage({
      role: lastMessage.role,
      parts: JSON.stringify(lastMessage.parts),
      attachments: {},
      chat: {
        connect: { id: chatId },
      },
    });
  }

  const tools = await createX402AITools(resourceIds, signer);

  const result = streamText({
    model: openai(model),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(50),
    tools,
    maxOutputTokens: 10000,
  });

  return result.toUIMessageStreamResponse({
    onFinish: async message => {
      for (const msg of message.messages) {
        await createMessage({
          role: msg.role,
          parts: JSON.stringify(msg.parts),
          attachments: {},
          chat: { connect: { id: chatId } },
        });
      }
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
}
