import z from 'zod';
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';

import { sendUsdcQueryParamsSchema } from '@/lib/schemas';

function inputSchemaFrom(schema: z.ZodType) {
  return z.toJSONSchema(schema, { io: 'input' });
}

export const sendUsdcExtension = declareDiscoveryExtension({
  input: {
    amount: 0.01,
    chain: 'solana',
    address: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
  },
  inputSchema: inputSchemaFrom(sendUsdcQueryParamsSchema),
  output: {
    example: {
      success: true,
      message:
        '0.01 USDC sent to 7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV on solana',
    },
  },
});
