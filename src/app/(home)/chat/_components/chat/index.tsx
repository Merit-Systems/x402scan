import { getWalletsFromHeaders } from '@/lib/wallet';
import { ChatContent } from './content';
import { ConnectDialog } from './auth/connect-dialog';
import { Onboarding } from './auth/welcome';

import type { Message } from '@prisma/client';
import { serverCookieUtils } from '../../_lib/cookies/server';

interface Props {
  id: string;
  initialMessages: Message[];
  isReadOnly?: boolean;
  storePreferences?: boolean;
}

export const Chat: React.FC<Props> = async ({
  id,
  initialMessages,
  isReadOnly,
  storePreferences,
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

  const preferences = await serverCookieUtils.getPreferences();

  const isConnected = await getWalletsFromHeaders()
    .then(wallets => wallets?.length && wallets.length > 0)
    .catch(() => false);

  return (
    <>
      <ChatContent
        id={id}
        initialMessages={initialMessages}
        isReadOnly={isReadOnly}
        initialPreferences={preferences}
        storePreferences={storePreferences}
      />
      {!isConnected && <ConnectDialog />}
      {isConnected && <Onboarding />}
    </>
  );
};
