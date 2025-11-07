import { adminProcedure, createTRPCRouter } from '../../trpc';
import { listAllEndUsers } from '@/services/cdp/end-users/list';

export const adminEndUsersRouter = createTRPCRouter({
  list: adminProcedure.query(async () => {
    return await listAllEndUsers();
  }),
});
