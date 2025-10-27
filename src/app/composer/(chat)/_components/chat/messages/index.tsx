'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';

import type { EmptyStateProps } from './empty-state';
import { EmptyState } from './empty-state';
import { LoadingMessage, Message } from './message';

import type { ChatStatus } from 'ai';
import type { UIMessage } from '@ai-sdk/react';
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text';

interface MessagesProps {
  messages: UIMessage[];
  status: ChatStatus;
  model: string;
  emptyState?: EmptyStateProps;
}

export const Messages: React.FC<MessagesProps> = ({
  messages,
  status,
  model,
  emptyState,
}) => {
  return (
    <Conversation className="h-full w-full">
      {messages.length > 0 ? (
        <>
          <ConversationContent className="max-w-4xl mx-auto">
            {messages.map(message => (
              <Message
                key={message.id}
                message={message}
                status={status}
                isLast={message.id === messages.at(-1)?.id}
              />
            ))}
            {status === 'submitted' ||
              (status === 'streaming' &&
                messages[messages.length - 1].parts.length === 0 && (
                  <AnimatedShinyText className="text-xs md:text-sm pb-4">
                    Calling {model} with x402...
                  </AnimatedShinyText>
                ))}
          </ConversationContent>
          <ConversationScrollButton />
        </>
      ) : (
        <EmptyState {...emptyState} />
      )}
    </Conversation>
  );
};

export const EmptyMessages = ({
  title,
  description,
  icon,
}: EmptyStateProps) => {
  return (
    <Conversation className="h-full w-full">
      <EmptyState title={title} description={description} icon={icon} />
    </Conversation>
  );
};

export const LoadingMessages = () => {
  return (
    <Conversation className="h-full w-full">
      <ConversationContent className="max-w-4xl mx-auto">
        <LoadingMessage from="user" numLines={2} />
        <LoadingMessage from="assistant" numLines={4} />
        <LoadingMessage from="user" numLines={1} />
        <LoadingMessage from="assistant" numLines={3} />
      </ConversationContent>
    </Conversation>
  );
};
