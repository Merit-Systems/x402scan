'use client';

import { isToolUIPart } from 'ai';

import { Skeleton } from '@/components/ui/skeleton';

import {
  Message as BaseMessage,
  MessageContent,
} from '@/components/ai-elements/message';

import { SourcesParts } from './parts/sources';
import { ToolPart } from './parts/tool';
import { ReasoningPart } from './parts/reasoning';
import { TextPart } from './parts/text';

import { cn } from '@/lib/utils';

import type { UIMessage, ChatStatus } from 'ai';
import type { UseChatHelpers } from '@ai-sdk/react';

interface Props {
  message: UIMessage;
  status: ChatStatus;
  isLast: boolean;
  chatId: string;
  addToolResult: UseChatHelpers<UIMessage>['addToolResult'];
}

export const Message: React.FC<Props> = ({
  message,
  status,
  isLast,
  chatId,
  addToolResult,
}) => {
  if (message.parts.length === 0) {
    return null;
  }

  return (
    <BaseMessage from={message.role}>
      {message.role === 'assistant' &&
        message.parts.some(part => part.type === 'source-url') && (
          <SourcesParts
            parts={message.parts.filter(part => part.type === 'source-url')}
          />
        )}
      {message.parts.map((part, i) => {
        if (isToolUIPart(part)) {
          return (
            <ToolPart
              key={`${part.toolCallId}-${i}`}
              part={part}
              chatId={chatId}
              addToolResult={addToolResult}
            />
          );
        } else {
          switch (part.type) {
            case 'text':
              return (
                <TextPart
                  key={`${part.type}-${i}`}
                  part={part}
                  showActions={
                    message.role === 'assistant' &&
                    i === message.parts.length - 1
                  }
                />
              );
            case 'reasoning':
              return (
                <ReasoningPart
                  key={`${part.type}-${i}`}
                  part={part}
                  status={status}
                  isLastPart={i === message.parts.length - 1}
                  isLastMessage={isLast}
                />
              );
            default:
              return null;
          }
        }
      })}
    </BaseMessage>
  );
};

interface LoadingMessageProps {
  from: UIMessage['role'];
  numLines: number;
}

export const LoadingMessage: React.FC<LoadingMessageProps> = ({
  from,
  numLines,
}) => {
  return (
    <BaseMessage from={from} className={cn('w-full')}>
      <MessageContent
        className={cn(
          'group-[.is-user]:bg-muted/50 w-full',
          numLines === 1 && 'w-1/2'
        )}
      >
        {Array.from({ length: numLines }).map((_, index) => (
          <Skeleton
            key={index}
            className={cn(
              'w-full h-4',
              index === numLines - 1 && numLines > 1 && 'w-1/2'
            )}
          />
        ))}
      </MessageContent>
    </BaseMessage>
  );
};
