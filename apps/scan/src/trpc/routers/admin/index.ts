import { createTRPCRouter } from '../../trpc';

import { adminResourcesRouter } from './resources';
import { adminSpendingRouter } from './spending';
import { adminFreeTierRouter } from './free-tier';

export const adminRouter = createTRPCRouter({
  resources: adminResourcesRouter,
  spending: adminSpendingRouter,
  freeTier: adminFreeTierRouter,
});
