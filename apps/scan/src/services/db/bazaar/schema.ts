import { z } from 'zod';

import { listTopSellersInputSchema } from '@/services/transfers/sellers/list';

export const listBazaarOriginsInputSchema = listTopSellersInputSchema.extend({
  tags: z.array(z.string()).optional(),
});
