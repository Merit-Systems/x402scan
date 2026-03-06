import { sendUsdcBodySchema } from '@/lib/schemas';

import type { z } from 'zod';

export function handleSend(body: z.infer<typeof sendUsdcBodySchema>) {
  return {
    success: true,
    message: `${body.amount} USDC sent to ${body.address} on ${body.chain}`,
  };
}
