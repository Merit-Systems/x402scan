import { createCallerFactory, createTRPCRouter } from '../trpc';

import { adminRouter } from './admin';
import { developerRouter } from './developer';
import { networksRouter } from './networks';
import { publicRouter } from './public';
import { resourcesRouter } from './resources';
import { userRouter } from './user';
import { onrampRouter } from './onramp';

export const appRouter = createTRPCRouter({
  resources: resourcesRouter,
  networks: networksRouter,
  user: userRouter,
  public: publicRouter,
  admin: adminRouter,
  developer: developerRouter,
  onramp: onrampRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
