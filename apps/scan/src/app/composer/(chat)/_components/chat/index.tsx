import { ChatContent } from './content';
import { ConnectDialog } from './auth';
import { Onboarding } from './onboarding';

import { serverCookieUtils } from '../../chat/_lib/cookies/server';

import { auth } from '@/auth';

import type { Message } from '../../../../../../../../databases/scan/src';
import type { RouterOutputs } from '@/trpc/client';

interface Props {
  id: string;
  initialMessages: Message[];
  agentConfig?: NonNullable<RouterOutputs['public']['agents']['get']>;
  isReadOnly?: boolean;
  storeConfig?: boolean;
}

export const Chat: React.FC<Props> = async ({
  id,
  initialMessages,
  isReadOnly,
  storeConfig,
  agentConfig,
}) => {
  if (isReadOnly) {
    return (
      <ChatContent
        id={id}
        initialMessages={initialMessages}
        isReadOnly={isReadOnly}
      />
    );
  }

  const session = await auth();

  const initialConfig = agentConfig
    ? {
        model:
          agentConfig.model ??
          (await serverCookieUtils.getConfig().then(config => config.model)) ??
          undefined,
        resources: agentConfig.resources.map(resource => ({
          id: resource.id,
          favicon: resource.favicon ?? null,
        })),
      }
    : await serverCookieUtils.getConfig();

  return (
    <>
      <ChatContent
        id={id}
        initialMessages={initialMessages}
        isReadOnly={isReadOnly}
        initialConfig={initialConfig}
        storeConfig={storeConfig}
        agentConfig={agentConfig}
      />
      {!session && <ConnectDialog agentConfig={agentConfig} />}
      {session && <Onboarding />}
    </>
  );
};
