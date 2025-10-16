'use client';

import { useState } from 'react';
import type { Chat } from '@prisma/client';
import type { UseAgentConfigurationReturn } from './use-agent-configuration';

interface UseChatSubmissionProps {
  isAuthed: boolean;
  currentChat: Chat | undefined;
  sendMessage: (
    message: { text: string },
    options?: {
      body?: {
        model: string;
        selectedTools: string[];
        chatId: string;
      };
    }
  ) => void;
  agentConfig?: UseAgentConfigurationReturn;
}

export function useChatSubmission({
  isAuthed,
  currentChat,
  sendMessage,
  agentConfig,
}: UseChatSubmissionProps) {
  const [input, setInput] = useState('');

  // Get model and tools directly from agentConfig
  const model = agentConfig?.currentAgent?.model ?? 'gpt-4o';
  const selectedTools = agentConfig?.currentAgent?.tools ?? [];

  // When model or tools change, update the agent configuration
  const handleSetModel = (newModel: string) => {
    if (agentConfig) {
      agentConfig.updateLocalAgent({ model: newModel });
    }
  };

  const handleSetSelectedTools = (newTools: string[]) => {
    if (agentConfig) {
      agentConfig.updateLocalAgent({ tools: newTools });
    }
  };

  const sendChatMessage = (text: string) => {
    if (!isAuthed) {
      return;
    }

    if (!text.trim()) {
      return;
    }
    if (!currentChat?.id) {
      throw new Error('Current chat not found');
    }
    sendMessage(
      { text },
      {
        body: {
          model: model,
          selectedTools: selectedTools,
          chatId: currentChat.id,
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendChatMessage(input);
    setInput('');
  };

  return {
    input,
    setInput,
    model,
    setModel: handleSetModel,
    selectedTools,
    setSelectedTools: handleSetSelectedTools,
    handleSubmit,
  };
}
