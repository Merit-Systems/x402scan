'use client';

import { useState } from 'react';

import Image from 'next/image';

import { Bot } from 'lucide-react';

import { useChat } from '@ai-sdk/react';

import { toast } from 'sonner';

import { Card } from '@/components/ui/card';

import { EmptyMessages, LoadingMessages, Messages } from './messages';
import { LoadingPromptInputSection, PromptInputSection } from './input';

import { api } from '@/trpc/client';

import { convertToUIMessages } from '@/lib/utils';

import { useSession } from 'next-auth/react';
import { clientCookieUtils } from '../../chat/_lib/cookies/client';

import type { Message } from '@prisma/client';
import type { ChatConfig, SelectedResource } from '../../_types/chat-config';
import type { RouterOutputs } from '@/trpc/client';
import type { LanguageModel } from './input/model-select/types';
import { languageModels } from './input/model-select/models';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';

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
  storeConfig,
  agentConfig,
}) => {
  const utils = api.useUtils();

  const { data: session } = useSession();

  const { data: usdcBalance } = api.user.serverWallet.usdcBaseBalance.useQuery(
    undefined,
    {
      enabled: !!session,
    }
  );
  const { data: freeTierUsage } = api.user.freeTier.usage.useQuery(undefined, {
    enabled: !!session,
  });
  const hasBalance = (usdcBalance ?? 0) > 0 || freeTierUsage?.hasFreeTier;

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages ? convertToUIMessages(initialMessages) : [],
    resume: true,
    id,
    generateId: () => id,
    onError: error => {
      toast.error(error.message);
      // could also open the deposit dialog here
    },
    onFinish: ({ messages }) => {
      if (messages.length > 0) {
        window.history.replaceState(
          {},
          '',
          agentConfig
            ? `/composer/agent/${agentConfig.id}/chat/${id}`
            : `/composer/chat/${id}`
        );
        void utils.user.chats.list.invalidate();
        void utils.user.freeTier.usage.invalidate();
        setTimeout(() => {
          void utils.user.serverWallet.usdcBaseBalance.invalidate();
        }, 3000);
      }
    },
  });

  const [input, setInput] = useState('');
  const [model, setModel] = useState<LanguageModel>(
    initialConfig?.model
      ? (languageModels.find(
          model => `${model.provider}/${model.modelId}` === initialConfig.model
        ) ?? languageModels[0])
      : languageModels[0]
  );
  const [selectedResources, setSelectedResources] = useState<
    SelectedResource[]
  >(initialConfig?.resources ?? []);

  const sendChatMessage = (text: string) => {
    if (!hasBalance) {
      toast.error('Please fund your wallet to continue');
      return;
    }
    if (!text.trim()) {
      toast.error('Please enter a message');
      return;
    }
    void sendMessage(
      { text },
      {
        body: {
          chatId: id,
          model: `${model.provider}/${model.modelId}`,
          messages,
          resourceIds: selectedResources.map(resource => resource.id),
          agentConfigurationId: agentConfig?.id,
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendChatMessage(input);
    setInput('');
  };

  const handleSetModel = (model: LanguageModel) => {
    setModel(model);
    void clientCookieUtils.setSelectedChatModel(
      `${model.provider}/${model.modelId}`
    );
  };

  const onSelectResource = (resource: SelectedResource) => {
    const newResources = [...selectedResources];
    const existingIndex = newResources.findIndex(r => r.id === resource.id);
    if (existingIndex !== -1) {
      newResources.splice(existingIndex, 1);
    } else {
      newResources.push(resource);
    }
    setSelectedResources(newResources);
    if (storeConfig) {
      clientCookieUtils.setResources(newResources);
    }
  };

  return (
    <div className="flex flex-col relative flex-1 h-0 overflow-hidden">
      <SidebarTrigger className="absolute top-2 left-2 bg-card z-2 md:hidden" />
      <Messages
        messages={messages}
        status={status}
        model={model.name}
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
