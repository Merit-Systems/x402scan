'use client';

import Image from 'next/image';

import { Bot } from 'lucide-react';

import { Card } from '@/components/ui/card';

import { EmptyMessages, LoadingMessages, Messages } from './messages';
import { LoadingPromptInputSection, PromptInputSection } from './input';

import type { Message } from '@x402scan/scan-db';
import type { ChatConfig } from '../../_types/chat-config';
import type { RouterOutputs } from '@/trpc/client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { useChat } from '../../_hooks/use-chat';

interface Props {
  id: string;
  initialMessages: Message[];
  isReadOnly?: boolean;
  initialConfig?: ChatConfig;
  storeConfig?: boolean;
  agentConfig?: RouterOutputs['public']['agents']['get'];
}

export const ChatContent: React.FC<Props> = ({
  id,
  isReadOnly,
  initialMessages,
  initialConfig,
  agentConfig,
}) => {
  const {
    messages,
    status,
    regenerate,
    errorMessage,
    sendChatMessage,
    handleSubmit,
    handleSetModel,
    onSelectResource,
    model,
    selectedResources,
    input,
    setInput,
  } = useChat({
    id,
    initialMessages,
    initialConfig,
    agentConfig,
  });

  return (
    <div className="flex flex-col relative flex-1 h-0 overflow-hidden">
      <SidebarTrigger className="absolute top-2 left-2 bg-card z-2 md:hidden" />
      <Messages
        messages={messages}
        status={status}
        model={model.name}
        errorMessage={errorMessage}
        onRegenerate={regenerate}
        emptyState={
          agentConfig
            ? {
                title: agentConfig.name || 'Untitled Agent',
                description:
                  agentConfig.description && agentConfig.description.length > 0
                    ? agentConfig.description
                    : 'No description',
                icon: agentConfig.image ? (
                  <Image
                    src={agentConfig.image}
                    alt={agentConfig.name}
                    width={96}
                    height={96}
                    className="size-12 md:size-16 rounded-md overflow-hidden"
                  />
                ) : (
                  <Card className="p-2 border">
                    <Bot className="size-8 md:size-12" />
                  </Card>
                ),
              }
            : undefined
        }
      />

      {!isReadOnly && (
        <div className="pb-2 md:pb-4">
          <div className="mx-auto max-w-4xl px-2 flex flex-col">
            {agentConfig?.starterPrompts !== undefined &&
              agentConfig.starterPrompts.length > 0 &&
              messages.length === 0 && (
                <Suggestions className="px-2 pb-2">
                  {agentConfig.starterPrompts.map(prompt => (
                    <Suggestion
                      key={prompt}
                      suggestion={prompt}
                      onClick={() => {
                        setInput('');
                        sendChatMessage(prompt);
                      }}
                    />
                  ))}
                </Suggestions>
              )}
            <PromptInputSection
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              model={model}
              setModel={handleSetModel}
              selectedResources={selectedResources}
              onSelectResource={onSelectResource}
              status={status}
              errorMessage={errorMessage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const LoadingEmptyChat = () => {
  return (
    <div className="flex flex-col relative flex-1 h-0 overflow-hidden">
      <EmptyMessages />
      <div className="pb-2 md:pb-4">
        <div className="mx-auto max-w-4xl px-2">
          <LoadingPromptInputSection />
        </div>
      </div>
    </div>
  );
};

export const LoadingMessagesChat = () => {
  return (
    <div className="flex flex-col relative flex-1 h-0 overflow-hidden">
      <LoadingMessages />
      <div className="pb-2 md:pb-4">
        <div className="mx-auto max-w-4xl px-2">
          <LoadingPromptInputSection />
        </div>
      </div>
    </div>
  );
};
