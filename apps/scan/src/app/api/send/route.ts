import { router, withCors, OPTIONS } from '@/lib/router';
import { sendUsdcBodySchema } from '@/lib/schemas';

export { OPTIONS };

let lastParsedAddress = '';

export const POST = withCors(
  router
    .route('send')
    .path('send')
    .paid(
      (body: { amount: number; address: string }) => {
        lastParsedAddress = body.address;
        return body.amount.toString();
      },
      {
        maxPrice: '1000',
        payTo: () => lastParsedAddress,
      }
    )
    .method('POST')
    .body(sendUsdcBodySchema)
    .description('Send USDC to an address on Base or Solana')
    .handler(({ body }) =>
      Promise.resolve({
        success: true,
        message: `${body.amount} USDC sent to ${body.address} on ${body.chain}`,
      })
    )
);
