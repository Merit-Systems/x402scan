import { listAllEndUsers } from "@/services/cdp/end-users/list";

import { adminProcedure, createTRPCRouter } from "../../trpc";

export const adminEndUsersRouter = createTRPCRouter({
  list: adminProcedure.query(async () => {
    return listAllEndUsers();
  }),
});
