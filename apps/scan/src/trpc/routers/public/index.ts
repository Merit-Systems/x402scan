import { createTRPCRouter } from "@/trpc/trpc";

import { publicAgentConfigurationsRouter } from "./agent-configurations";
import { publicChatsRouter } from "./chats";
import { facilitatorsRouter } from "./facilitators";
import { originsRouter } from "./origins";
import { resourcesRouter } from "./resources";
import { sellersRouter } from "./sellers";
import { solanaRouter } from "./solana";
import { statsRouter } from "./stats";
import { publicToolsRouter } from "./tools";
import { transfersRouter } from "./transfers";

export const publicRouter = createTRPCRouter({
  agents: publicAgentConfigurationsRouter,
  chats: publicChatsRouter,
  origins: originsRouter,
  tools: publicToolsRouter,
  facilitators: facilitatorsRouter,
  transfers: transfersRouter,
  sellers: sellersRouter,
  stats: statsRouter,
  resources: resourcesRouter,
  solana: solanaRouter,
});
