import { useState, useRef, useEffect } from 'react';

import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import { useChat as useAiChat } from '@ai-sdk/react';

import { toast } from 'sonner';

import { api } from '@/trpc/client';

import { languageModels } from '../_components/chat/input/model-select/models';

import { clientCookieUtils } from '../chat/_lib/cookies/client';

import { convertToUIMessages } from '@/lib/utils';

import type { RouterOutputs } from '@/trpc/client';
import type { ChatConfig, SelectedResource } from '../_types/chat-config';
import type { LanguageModel } from '../_components/chat/input/model-select/types';
import type { Message } from '@x402scan/scan-db/types';

interface Props {
  id: string;
  initialMessages: Message[];
  agentConfig?: RouterOutputs['public']['agents']['get'];
  initialConfig?: ChatConfig;
}

export const useChat = ({
  id,
  initialMessages,
  agentConfig,
  initialConfig,
}: Props) => {
  const utils = api.useUtils();

  const [input, setInput] = useState('');
  const [model, setModel] = useState<LanguageModel>(
    initialConfig?.model
      ? (languageModels.find(
          model => `${model.provider}/${model.modelId}` === initialConfig.model
        ) ?? languageModels[0]!)
      : languageModels[0]!
  );
  const [selectedResources, setSelectedResources] = useState<
    SelectedResource[]
  >(initialConfig?.resources ?? []);

  // Use refs to ensure the callback always has access to the latest values
  const modelRef = useRef(model);
  const selectedResourcesRef = useRef(selectedResources);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  useEffect(() => {
    selectedResourcesRef.current = selectedResources;
  }, [selectedResources]);

  const { messages, sendMessage, status, regenerate, error, addToolResult } =
    useAiChat({
      messages: initialMessages ? convertToUIMessages(initialMessages) : [],
      resume: true,
      id,
      onError: ({ message }) => toast.error(message),
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
        }
      },
      transport: new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest({ messages }) {
          const currentModel = modelRef.current;
          const currentSelectedResources = selectedResourcesRef.current;
          return {
            body: {
              chatId: id,
              model: `${currentModel.provider}/${currentModel.modelId}`,
              message: messages[messages.length - 1],
              resourceIds: currentSelectedResources.map(
                resource => resource.id
              ),
              agentConfigurationId: agentConfig?.id,
            },
          };
        },
      }),
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

  const errorMessage =
    error?.message ??
    (status === 'ready' &&
    messages.length > 0 &&
    messages[messages.length - 1]!.role === 'user'
      ? 'The last message failed. Please regenerate the message to continue.'
      : undefined);

  const sendChatMessage = (text: string) => {
    if (status !== 'ready') {
      toast.error('Please wait for the chat to be ready');
      return;
    }
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }
    if (!text.trim()) {
      toast.error('Please enter a message');
      return;
    }
    void sendMessage({ text });
    setInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendChatMessage(input);
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
    if (!agentConfig) {
      clientCookieUtils.setResources(newResources);
    }
  };

  return {
    messages,
    sendMessage,
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
    addToolResult,
  };
};
