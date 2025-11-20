import { after, NextResponse, type NextRequest } from 'next/server';

import z from 'zod';

import { createToolCall } from '@/services/db/composer/tool-call';
import { listResourcesForTools } from '@/services/db/resources/resource';

import {
  EnhancedPaymentRequirementsSchema,
  enhancedOutputSchema,
} from '@/lib/x402/schema';
import { supportedChainSchema } from '@/lib/schemas';

import { SUPPORTED_CHAINS } from '@/types/chain';

import type { SupportedChain } from '@/types/chain';
import { fetchWithProxy } from '@/lib/x402/proxy-fetch';

const bodySchema = z.object({
  resourceId: z.string(),
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

  const { resourceId, chatId, chain, parameters } = requestBody.data;

  console.log(parameters);

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

  const parsedAccept = EnhancedPaymentRequirementsSchema.extend({
    outputSchema: enhancedOutputSchema,
  }).safeParse({
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

  const method = parsedAccept.data.outputSchema.input.method.toUpperCase();

  let url = resource.resource;

  // Filter out headers that should be set automatically by fetch
  const headersToExclude = new Set([
    'content-length',
    'transfer-encoding',
    'connection',
    'host',
  ]);

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

  after(async () => {
    if (response.status === 200) {
      void createToolCall({
        resource: {
          connect: { id: resource.id },
        },
        chat: {
          connect: { id: chatId },
        },
      });
    }
  });

  return NextResponse.json(await response.json(), {
    status: response.status,
    headers: response.headers,
  });
};
