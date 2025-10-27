import { createTRPCRouter } from '../../trpc';

import { adminResourcesRouter } from './resources';
import { adminWalletsRouter } from './wallets';

export const adminRouter = createTRPCRouter({
  resources: adminResourcesRouter,
  wallets: adminWalletsRouter,
});
