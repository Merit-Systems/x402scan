import { z } from 'zod';

import { listTopSellersMVInputSchema } from '@/services/transfers/sellers/list-mv';

export const listBazaarOriginsInputSchema = listTopSellersMVInputSchema.extend({
  tags: z.array(z.string()).optional(),
});
