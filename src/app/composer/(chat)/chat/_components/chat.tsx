import { Chat as BaseChat } from '../../_components/chat';

import type { Message } from '@prisma/client';

interface Props {
  id: string;
  initialMessages: Message[];
  isReadOnly?: boolean;
}

export const Chat: React.FC<Props> = async ({
  id,
  initialMessages,
  isReadOnly,
}) => {
  return (
    <BaseChat
      id={id}
      initialMessages={initialMessages}
      isReadOnly={isReadOnly}
      storeConfig={true}
    />
  );
};
