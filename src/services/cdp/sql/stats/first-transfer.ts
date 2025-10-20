import z from 'zod';

import { baseQuerySchema } from '../lib';
import { ethereumAddressSchema } from '@/lib/schemas';
import { getFirstTransferTimestamp as getFirstTransferTimestampFromDb } from '@/services/db/transfers';

export const getFirstTransferTimestampInputSchema = baseQuerySchema.extend({
  addresses: z.array(ethereumAddressSchema).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const getFirstTransferTimestamp = async (
  input: z.input<typeof getFirstTransferTimestampInputSchema>
): Promise<Date | null> => {
  const parseResult = getFirstTransferTimestampInputSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error('Invalid input: ' + parseResult.error.message);
  }
  const { addresses, startDate, endDate, facilitators, tokens } =
    parseResult.data;

  return await getFirstTransferTimestampFromDb({
    facilitatorIds: facilitators,
    tokenAddresses: tokens,
    recipientAddresses: addresses,
    startDate,
    endDate,
  });
};
