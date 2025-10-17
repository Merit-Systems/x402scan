import { createCallerFactory, createTRPCRouter } from '../trpc';

import { acceptsRouter } from './accepts';
import { agentConfigurationsRouter } from './agent-configurations';
import { availableToolsRouter } from './available-tools';
import { chatsRouter } from './chats';
import { facilitatorsRouter } from './facilitators';
import { onrampSessionsRouter } from './onramp-sessions';
import { originsRouter } from './origins';
import { resourcesRouter } from './resources';
import { resourceTagsRouter } from './resource-tags';
import { resourceRequestMetadataRouter } from './resource-request-metadata';
import { sellersRouter } from './sellers';
import { statisticsRouter } from './statistics';
import { transactionsRouter } from './transactions';
import { transfersRouter } from './transfers';
import { serverWalletRouter } from './server-wallet';
import { toolsRouter } from './tools';

export const appRouter = createTRPCRouter({
  accepts: acceptsRouter,
  agentConfigurations: agentConfigurationsRouter,
  chats: chatsRouter,
  stats: statisticsRouter,
  sellers: sellersRouter,
  resources: resourcesRouter,
  resourceTags: resourceTagsRouter,
  resourceRequestMetadata: resourceRequestMetadataRouter,
  origins: originsRouter,
  transactions: transactionsRouter,
  transfers: transfersRouter,
  facilitators: facilitatorsRouter,
  onrampSessions: onrampSessionsRouter,
  availableTools: availableToolsRouter,
  serverWallet: serverWalletRouter,
  tools: toolsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
