import { z } from 'zod';

import { listTopSellersMVInputSchema } from '@/services/transfers/sellers/list-mv';

export const listBazaarOriginsInputSchema = listTopSellersMVInputSchema.extend({
  tags: z.array(z.string()).optional(),
  originUrls: z.array(z.string()).optional(),
});

// Featured variant has no `originUrls` — the server resolves the AgentCash
// catalog set internally (~305 URLs). Sending those over the wire on every
// re-sort would blow tRPC's URL length limit.
export const listFeaturedBazaarOriginsInputSchema =
  listTopSellersMVInputSchema.extend({
    tags: z.array(z.string()).optional(),
  });
