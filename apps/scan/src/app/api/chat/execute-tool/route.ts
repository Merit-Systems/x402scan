import { after, NextResponse, type NextRequest } from 'next/server';

import { isToolUIPart } from 'ai';

import z from 'zod';

import { createToolCall } from '@/services/db/composer/tool-call';
import { listResourcesForTools } from '@/services/db/resources/resource';
import { getChat, updateChat } from '@/services/db/composer/chat';

import { auth } from '@/auth';

import { messageSchema } from '@/lib/message-schema';
import { fetchWithProxy, normalizedAcceptSchema } from '@/lib/x402';
import { supportedChainSchema } from '@/lib/schemas';

import { SUPPORTED_CHAINS } from '@/types/chain';

import type { SupportedChain } from '@/types/chain';

const bodySchema = z.object({
  resourceId: z.string(),
  toolCallId: z.string(),
  chatId: z.string(),
  chain: supportedChainSchema,
  parameters: z.record(z.string(), z.unknown()),
});

export const POST = async (request: NextRequest) => {
  const requestBody = bodySchema.safeParse(await request.json());

  if (!requestBody.success) {
    return NextResponse.json(
      {
        error: 'Bad request',
      },
      { status: 400 }
    );
  }

  const { resourceId, toolCallId, chatId, chain, parameters } =
    requestBody.data;

  const session = await auth();

  if (!session) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
      },
      { status: 401 }
    );
  }

  const chat = await getChat(chatId, session.user.id);

  if (!chat) {
    return NextResponse.json(
      {
        error: 'Chat not found',
      },
      { status: 404 }
    );
  }

  if (chat.userId !== session.user.id) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
      },
      { status: 401 }
    );
  }

  if (chat.messages.length === 0) {
    return NextResponse.json(
      {
        error: 'No messages in chat',
      },
      { status: 400 }
    );
  }

  const rawLastMessage = chat.messages[chat.messages.length - 1];

  const parsedLastMessage = messageSchema.safeParse({
    ...rawLastMessage,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    parts: JSON.parse(rawLastMessage!.parts as string),
  });
  if (!parsedLastMessage.success) {
    console.error(parsedLastMessage.error);
    return NextResponse.json(
      {
        error: 'Invalid last message',
      },
      { status: 400 }
    );
  }

  const lastMessage = parsedLastMessage.data;

  const toolPart = lastMessage.parts.find(
    part => isToolUIPart(part) && part.toolCallId === toolCallId
  );

  if (!toolPart) {
    return NextResponse.json(
      {
        error: 'Tool part not found',
      },
      { status: 404 }
    );
  }

  const [resource] = await listResourcesForTools([resourceId]);

  if (!resource) {
    return NextResponse.json(
      {
        error: 'Resource not found',
      },
      { status: 404 }
    );
  }

  const accept = resource.accepts?.find(
    accept => accept.network.toString() === chain.toString()
  );

  if (!accept) {
    return NextResponse.json(
      {
        error: 'This resource does not accept pay on the selected network',
      },
      { status: 400 }
    );
  }

  const parsedAccept = normalizedAcceptSchema.safeParse({
    ...accept,
    maxAmountRequired: accept.maxAmountRequired.toString(),
  });
  if (!parsedAccept.success) {
    return NextResponse.json(
      {
        error: 'Invalid accept',
      },
      { status: 400 }
    );
  }

  const outputSchema = parsedAccept.data.outputSchema;
  if (!outputSchema) {
    return NextResponse.json(
      {
        error: 'Resource does not have an output schema for execution',
      },
      { status: 400 }
    );
  }

  const method = outputSchema.input.method.toUpperCase();

  let url = resource.resource;

  // Filter out headers that should be set automatically by fetch
  const headersToExclude = new Set(['content-length', 'transfer-encoding']);

  const filteredHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!headersToExclude.has(key.toLowerCase())) {
      filteredHeaders[key] = value;
    }
  });

  const requestInit: RequestInit = { method, headers: filteredHeaders };

  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(parameters)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          queryParams.append(key, JSON.stringify(value));
        } else if (typeof value === 'number') {
          queryParams.append(key, String(value));
        } else {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          queryParams.append(key, String(value));
        }
      }
    }
    url = `${resource.resource}?${queryParams.toString()}`;
  }
  // For POST/PUT/PATCH/DELETE: send as JSON body
  else {
    requestInit.body = JSON.stringify({ ...parameters });
    requestInit.headers = {
      ...(requestInit.headers instanceof Headers
        ? Object.fromEntries(requestInit.headers.entries())
        : requestInit.headers),
      'Content-Type': 'application/json',
    };
  }

  if (
    resource.requestMetadata &&
    typeof resource.requestMetadata.headers === 'object' &&
    resource.requestMetadata.headers !== null &&
    !Array.isArray(resource.requestMetadata.headers) &&
    resource.requestMetadata.headers !== undefined &&
    Object.keys(resource.requestMetadata.headers).length > 0
  ) {
    requestInit.headers = {
      ...(requestInit.headers instanceof Headers
        ? Object.fromEntries(requestInit.headers.entries())
        : requestInit.headers),
      ...resource.requestMetadata.headers,
    } as HeadersInit;
  }

  const supportedAccepts = resource.accepts.filter(accept =>
    SUPPORTED_CHAINS.includes(accept.network as SupportedChain)
  );

  if (supportedAccepts.length === 0) {
    return NextResponse.json(
      {
        error:
          'This resource does not accept USDC on any networks supported by x402scan',
      },
      { status: 400 }
    );
  }

  const response = await fetchWithProxy(url, requestInit);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = await response.json();

  after(async () => {
    if (response.status === 200) {
      await Promise.all([
        updateChat(session.user.id, chatId, {
          messages: {
            update: {
              where: {
                id: lastMessage.id,
              },
              data: {
                parts: JSON.stringify(
                  lastMessage.parts.map(part => {
                    if (isToolUIPart(part) && part.toolCallId === toolCallId) {
                      return {
                        ...part,
                        state: 'output-available',
                        output: data,
                      };
                    }
                    return part;
                  })
                ),
              },
            },
          },
        }),
        createToolCall({
          resource: {
            connect: { id: resource.id },
          },
          chat: {
            connect: { id: chatId },
          },
        }),
      ]);
    }
  });

  return NextResponse.json(data, {
    status: response.status,
    headers: response.headers,
  });
};
