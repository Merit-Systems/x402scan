import type { z } from "zod";

import type { sendUsdcBodySchema } from "@/lib/schemas";

export function handleSend(body: z.infer<typeof sendUsdcBodySchema>) {
  return {
    success: true,
    message: `${String(body.amount)} USDC sent to ${body.address} on ${body.chain}`,
  };
}
