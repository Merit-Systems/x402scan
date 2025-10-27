import { createCallerFactory, createTRPCRouter } from '../trpc';

import { networksRouter } from './networks';
import { resourcesRouter } from './resources';
import { userRouter } from './user';
import { publicRouter } from './public';
import { adminRouter } from './admin';

export const appRouter = createTRPCRouter({
  resources: resourcesRouter,
  networks: networksRouter,
  user: userRouter,
  public: publicRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
