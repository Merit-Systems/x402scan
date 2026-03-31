import { router, withCors, OPTIONS } from '@/lib/router';
import { sendUsdcBodySchema } from '@/lib/schemas';
import { handleSend } from '@/app/api/x402/_handlers/send';

export { OPTIONS };

export const POST = withCors(
  router
    .route('x402/send')
    .path('x402/send')
    .paid(
      (body: { amount: number; address: string }) => body.amount.toString(),
      {
        maxPrice: '1000',
        payTo: (_req, body) => (body as { address: string }).address,
      }
    )
    .method('POST')
    .body(sendUsdcBodySchema)
    .description('Send USDC to an address on Base or Solana')
    .handler(({ body }) => Promise.resolve(handleSend(body)))
);
