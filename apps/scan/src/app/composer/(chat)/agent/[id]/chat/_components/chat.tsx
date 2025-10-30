import { Chat } from '../../../../_components/chat';

import type { Message } from '@prisma/client';
import type { RouterOutputs } from '@/trpc/client';

interface Props {
  id: string;
  initialMessages: Message[];
  agentConfig: NonNullable<RouterOutputs['public']['agents']['get']>;
  isReadOnly?: boolean;
}

export const AgentChat: React.FC<Props> = async ({
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
