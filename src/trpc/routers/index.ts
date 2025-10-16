import { createCallerFactory, createTRPCRouter } from '../trpc';

import { acceptsRouter } from './accepts';
import { agentConfigurationsRouter } from './agent-configurations';
import { availableToolsRouter } from './available-tools';
import { chatsRouter } from './chats';
import { facilitatorsRouter } from './facilitators';
import { onrampSessionsRouter } from './onramp-sessions';
import { originsRouter } from './origins';
import { resourcesRouter } from './resources';
import { sellersRouter } from './sellers';
import { statisticsRouter } from './statistics';
import { transactionsRouter } from './transactions';
import { transfersRouter } from './transfers';
import { serverWalletRouter } from './server-wallet';

export const appRouter = createTRPCRouter({
  accepts: acceptsRouter,
  agentConfigurations: agentConfigurationsRouter,
  chats: chatsRouter,
  stats: statisticsRouter,
  sellers: sellersRouter,
  resources: resourcesRouter,
  origins: originsRouter,
  transactions: transactionsRouter,
  transfers: transfersRouter,
  facilitators: facilitatorsRouter,
  onrampSessions: onrampSessionsRouter,
  availableTools: availableToolsRouter,
  serverWallet: serverWalletRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
