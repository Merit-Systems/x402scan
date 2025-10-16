'use client';

import { CopyIcon, MessageSquare } from 'lucide-react';
import { Fragment } from 'react';
import { Action, Actions } from '@/app/_components/chat/ai-elements/actions';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/app/_components/chat/ai-elements/conversation';
import { Loader } from '@/app/_components/chat/ai-elements/loader';
import {
  Message,
  MessageContent,
} from '@/app/_components/chat/ai-elements/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/app/_components/chat/ai-elements/reasoning';
import { Response } from '@/app/_components/chat/ai-elements/response';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
  ToolInput,
} from '@/app/_components/chat/ai-elements/tool';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/app/_components/chat/ai-elements/sources';
import { isToolUIPart } from 'ai';
import type { UIMessage } from '@ai-sdk/react';
import type { ChatStatus } from '@/app/_components/chat/chat';

interface MessagesProps {
  messages: UIMessage[];
  status: ChatStatus;
}

export const Messages = ({ messages, status }: MessagesProps) => {
  return (
    <Conversation className="h-80% w-full max-w-4xl mx-auto">
      <ConversationContent>
        {messages.length === 0 ? (
          <ConversationEmptyState
            icon={<MessageSquare className="size-12" />}
            title="No messages yet"
            description="Start a conversation to see messages here"
          />
        ) : (
          messages.map(message => (
            <div key={message.id}>
              {message.role === 'assistant' &&
                message.parts.filter(part => part.type === 'source-url')
                  .length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(part => part.type === 'source-url')
                          .length
                      }
                    />
                    {message.parts
                      .filter(part => part.type === 'source-url')
                      .map((part, i) => (
                        <SourcesContent key={`${message.id}-${i}`}>
                          <Source
                            key={`${message.id}-${i}`}
                            href={part.url}
                            title={part.url}
                          />
                        </SourcesContent>
                      ))}
                  </Sources>
                )}
              {message.parts.map((part, i) => {
                if (isToolUIPart(part)) {
                  return (
                    <Tool key={`${message.id}-${i}`} defaultOpen={false}>
                      <ToolHeader type={part.type} state={part.state} />
                      <ToolContent>
                        <ToolInput input={part.input} />
                        <ToolOutput
                          output={JSON.stringify(part.output)}
                          errorText={part.errorText}
                        />
                      </ToolContent>
                    </Tool>
                  );
                } else {
                  switch (part.type) {
                    case 'text':
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              <Response key={`${message.id}-${i}`}>
                                {part.text}
                              </Response>
                            </MessageContent>
                          </Message>
                          {message.role === 'assistant' &&
                            i === messages.length - 1 && (
                              <Actions className="mt-2">
                                <Action
                                  onClick={() =>
                                    navigator.clipboard.writeText(part.text)
                                  }
                                  label="Copy"
                                >
                                  <CopyIcon className="size-3" />
                                </Action>
                              </Actions>
                            )}
                        </Fragment>
                      );
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={
                            status === 'streaming' &&
                            i === message.parts.length - 1 &&
                            message.id === messages.at(-1)?.id
                          }
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    default:
                      return null;
                  }
                }
              })}
            </div>
          ))
        )}
        {status === 'submitted' && <Loader />}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};
