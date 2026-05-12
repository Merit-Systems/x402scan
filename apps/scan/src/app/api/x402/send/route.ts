import { router, solanaRouter, withCors, OPTIONS } from '@/lib/router';
import { chainSchema, sendUsdcBodySchema } from '@/lib/schemas';
import { handleSend } from '@/app/api/x402/_handlers/send';
import { Chain } from '@/types/chain';

import type { NextRequest } from 'next/server';

export { OPTIONS };

const createSendHandler = (sendRouter: typeof router) =>
  sendRouter
    .route('x402/send')
    .path('x402/send')
    .paid(
      (body: { amount: number; address: string }) => body.amount.toString(),
      {
        maxPrice: '1000',
        payTo: (_req, body) =>
          (body as { address: string } | undefined)?.address ?? '',
      }
    )
    .method('POST')
    .body(sendUsdcBodySchema)
    .description('Send USDC to an address on Base or Solana')
    .handler(({ body }) => Promise.resolve(handleSend(body)));

const baseSendHandler = createSendHandler(router);
const solanaSendHandler = createSendHandler(solanaRouter);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function getRequestedChain(req: NextRequest): Promise<Chain | undefined> {
  const body: unknown = await req
    .clone()
    .json()
    .catch(() => undefined);

  if (!isRecord(body)) return undefined;

  const chain = chainSchema.safeParse(body.chain);

  return chain.success ? chain.data : undefined;
}

export const POST = withCors(async req => {
  const chain = await getRequestedChain(req);

  return chain === Chain.SOLANA ? solanaSendHandler(req) : baseSendHandler(req);
});
