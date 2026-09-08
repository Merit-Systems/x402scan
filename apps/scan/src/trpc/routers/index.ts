import { createCallerFactory, createTRPCRouter } from '../trpc';

import { adminRouter } from './admin';
import { developerRouter } from './developer';
import { networksRouter } from './networks';
import { publicRouter } from './public';
import { userRouter } from './user';

export const appRouter = createTRPCRouter({
  networks: networksRouter,
  user: userRouter,
  public: publicRouter,
  admin: adminRouter,
  developer: developerRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
