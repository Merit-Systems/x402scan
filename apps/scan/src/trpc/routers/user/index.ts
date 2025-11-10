import { createTRPCRouter } from '../../trpc';

import { userAcknowledgementsRouter } from './acknowledgements';
import { userAgentConfigurationsRouter } from './agent-configurations';
import { userChatsRouter } from './chats';
import { onrampSessionsRouter } from './onramp-sessions';
import { serverWalletRouter } from './server-wallet';
import { userToolsRouter } from './tools';
import { uploadRouter } from './upload';

export const userRouter = createTRPCRouter({
  acknowledgements: userAcknowledgementsRouter,
  agentConfigurations: userAgentConfigurationsRouter,
  chats: userChatsRouter,
  onrampSessions: onrampSessionsRouter,
  serverWallet: serverWalletRouter,
  upload: uploadRouter,
  tools: userToolsRouter,
});
