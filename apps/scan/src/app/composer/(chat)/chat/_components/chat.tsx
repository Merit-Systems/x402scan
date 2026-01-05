import { Chat as BaseChat } from '../../_components/chat';

import type { Message } from '@x402scan/scan-db/types';

type Props = {
  id: string;
  initialMessages: Message[];
  isReadOnly?: boolean;
};

export const Chat: React.FC<Props> = ({ id, initialMessages, isReadOnly }) => {
  return (
    <BaseChat
      id={id}
      initialMessages={initialMessages}
      isReadOnly={isReadOnly}
      storeConfig={true}
    />
  );
};
