import { createTRPCRouter } from "../../trpc";
import { adminComposerBalancesRouter } from "./composer-balances";
import { adminEndUsersRouter } from "./end-users";
import { adminFreeTierRouter } from "./free-tier";
import { adminInviteCodesRouter } from "./invite-codes";
import { adminPartnersRouter } from "./partners";
import { adminResourcesRouter } from "./resources";
import { adminSpendingRouter } from "./spending";

export const adminRouter = createTRPCRouter({
  resources: adminResourcesRouter,
  spending: adminSpendingRouter,
  freeTier: adminFreeTierRouter,
  endUsers: adminEndUsersRouter,
  inviteCodes: adminInviteCodesRouter,
  partners: adminPartnersRouter,
  composerBalances: adminComposerBalancesRouter,
});
