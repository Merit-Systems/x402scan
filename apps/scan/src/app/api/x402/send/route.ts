import { router, solanaRouter, withCors, OPTIONS } from '@/lib/router';
import { sendUsdcBodySchema } from '@/lib/schemas';
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

async function getRequestedChain(req: NextRequest) {
  const body = await req
    .clone()
    .json()
    .catch(() => undefined);

  return typeof body === 'object' && body !== null && 'chain' in body
    ? body.chain
    : undefined;
}

export const POST = withCors(async req => {
  const chain = await getRequestedChain(req);

  return chain === Chain.SOLANA ? solanaSendHandler(req) : baseSendHandler(req);
});
