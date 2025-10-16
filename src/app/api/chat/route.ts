import { InvokeAgent } from '@/services/agent/core';
import { getOrCreateWalletFromUserId } from '@/services/cdp/server-wallet/get-or-create';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { Signer } from 'x402/types';
import type { UIMessage } from '@ai-sdk/react';
import { toAccount } from 'viem/accounts';
import { getSelectedTools } from '@/services/agent/core';
import { createMessage } from '@/services/db/chats';
export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const walletClient = await getOrCreateWalletFromUserId(session.user.id);

  const requestBody = (await request.json()) as {
    model: string;
    selectedTools: string[];
    messages: UIMessage[];
    chatId: string;
  };

  const { model, selectedTools, messages, chatId } = requestBody;

  const toolsToCallWith = await getSelectedTools(
    toAccount(walletClient) as Signer,
    selectedTools
  );
  // Only save the newest user message to the database, onFinish
  // will save the rest.
  const lastMessage = messages[messages.length - 1];
  await createMessage({
    role: lastMessage.role,
    parts: JSON.stringify(lastMessage.parts),
    attachments: {},
    chat: {
      connect: { id: chatId },
    },
  });

  const result = await InvokeAgent(
    model,
    toAccount(walletClient) as Signer,
    messages,
    toolsToCallWith
  );

  // save the result to the database

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
