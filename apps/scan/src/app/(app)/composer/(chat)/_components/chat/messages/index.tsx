"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";

import type { EmptyStateProps } from "./empty-state";
import { EmptyState } from "./empty-state";
import { LoadingMessage, Message } from "./message";

import type { ChatStatus } from "ai";
import type { UIMessage, UseChatHelpers } from "@ai-sdk/react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { ErrorState } from "./error";

interface MessagesProps {
  messages: UIMessage[];
  status: ChatStatus;
  model: string;
  chatId: string;
  onRegenerate: () => void;
  addToolOutput: UseChatHelpers<UIMessage>["addToolOutput"];
  errorMessage?: string;
  emptyState?: EmptyStateProps;
}

export const Messages: React.FC<MessagesProps> = ({
  messages,
  status,
  model,
  chatId,
  errorMessage,
  onRegenerate,
  addToolOutput,
  emptyState,
}) => {
  return (
    <Conversation className="size-full">
      {messages.length > 0 ? (
        <>
          <ConversationContent className="mx-auto max-w-4xl pb-8">
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                status={status}
                isLast={message.id === messages.at(-1)?.id}
                chatId={chatId}
                addToolOutput={addToolOutput}
              />
            ))}
            {(status === "submitted" ||
              (status === "streaming" &&
                messages.at(-1)?.parts.length === 0)) && (
              <AnimatedShinyText className="type-supporting-body pb-4">
                Calling {model} with x402...
              </AnimatedShinyText>
            )}
            {errorMessage !== undefined && (
              <ErrorState message={errorMessage} onRegenerate={onRegenerate} />
            )}
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
    <Conversation className="size-full">
      <EmptyState title={title} description={description} icon={icon} />
    </Conversation>
  );
};

export const LoadingMessages = () => {
  return (
    <Conversation className="size-full">
      <ConversationContent className="mx-auto max-w-4xl">
        <LoadingMessage from="user" numLines={2} />
        <LoadingMessage from="assistant" numLines={4} />
        <LoadingMessage from="user" numLines={1} />
        <LoadingMessage from="assistant" numLines={3} />
      </ConversationContent>
    </Conversation>
  );
};
