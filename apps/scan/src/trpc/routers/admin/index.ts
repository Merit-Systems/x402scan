import { createTRPCRouter } from '../../trpc';

import { adminResourcesRouter } from './resources';
import { adminSpendingRouter } from './spending';
import { adminFreeTierRouter } from './free-tier';
import { adminEndUsersRouter } from './end-users';
import { adminInviteCodesRouter } from './invite-codes';
import { adminUsersRouter } from './users';

export const adminRouter = createTRPCRouter({
  resources: adminResourcesRouter,
  spending: adminSpendingRouter,
  freeTier: adminFreeTierRouter,
  endUsers: adminEndUsersRouter,
  inviteCodes: adminInviteCodesRouter,
  users: adminUsersRouter,
});
