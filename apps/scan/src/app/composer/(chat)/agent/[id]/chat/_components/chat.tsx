import { Chat } from '../../../../_components/chat';

import type { Message } from '@x402scan/scan-db/types';
import type { RouterOutputs } from '@/trpc/client';

type Props = {
  id: string;
  initialMessages: Message[];
  agentConfig: NonNullable<RouterOutputs['public']['agents']['get']>;
  isReadOnly?: boolean;
};

export const AgentChat: React.FC<Props> = ({
  id,
  initialMessages,
  agentConfig,
  isReadOnly,
}) => {
  return (
    <Chat
      id={id}
      initialMessages={initialMessages}
      isReadOnly={isReadOnly}
      storeConfig={false}
      agentConfig={agentConfig}
    />
  );
};
