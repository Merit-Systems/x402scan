import { createTRPCRouter } from '../../trpc';

import { adminResourcesRouter } from './resources';

export const adminRouter = createTRPCRouter({
  resources: adminResourcesRouter,
});
