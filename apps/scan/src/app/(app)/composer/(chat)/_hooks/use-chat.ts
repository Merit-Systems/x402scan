import { useMemo, useState } from "react";

import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useChat as useAiChat } from "@ai-sdk/react";

import { toast } from "sonner";

import { api } from "@/trpc/client";

import { languageModels } from "../_lib/language-models/models";

import { clientCookieUtils } from "./client-cookie-utils";

import { convertToUIMessages } from "@/lib/utils";

import type { RouterOutputs } from "@/trpc/client";
import type { ChatConfig, SelectedResource } from "../../_types/chat-config";
import type { LanguageModel } from "../_lib/language-models/types";
import type { Message } from "@x402scan/scan-db/types";

interface Props {
  id: string;
  initialMessages: Message[];
  agentConfig?: RouterOutputs["public"]["agents"]["get"];
  initialConfig?: ChatConfig;
}

const defaultLanguageModel = languageModels.at(0);
if (!defaultLanguageModel) {
  throw new Error("At least one language model must be configured");
}

export const useChat = ({
  id,
  initialMessages,
  agentConfig,
  initialConfig,
}: Props) => {
  const utils = api.useUtils();

  const [input, setInput] = useState("");
  const [model, setModel] = useState<LanguageModel>(
    initialConfig?.model
      ? (languageModels.find(
          (model) =>
            `${model.provider}/${model.modelId}` === initialConfig.model
        ) ?? defaultLanguageModel)
      : defaultLanguageModel
  );
  const [selectedResources, setSelectedResources] = useState<
    SelectedResource[]
  >(initialConfig?.resources ?? []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest({ messages }) {
          return {
            body: {
              chatId: id,
              model: `${model.provider}/${model.modelId}`,
              message: messages.at(-1),
              resourceIds: selectedResources.map((resource) => resource.id),
              agentConfigurationId: agentConfig?.id,
            },
          };
        },
      }),
    [agentConfig?.id, id, model, selectedResources]
  );

  const { messages, sendMessage, status, regenerate, error, addToolOutput } =
    useAiChat({
      messages: convertToUIMessages(initialMessages),
      resume: true,
      id,
      onError: ({ message }) => toast.error(message),
      onFinish: ({ messages }) => {
        if (messages.length > 0) {
          window.history.replaceState(
            {},
            "",
            agentConfig
              ? `/composer/agent/${agentConfig.id}/chat/${id}`
              : `/composer/chat/${id}`
          );
          void utils.user.chats.list.invalidate();
        }
      },
      transport,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

  const errorMessage =
    error?.message ??
    (status === "ready" &&
    messages.length > 0 &&
    messages.at(-1)?.role === "user"
      ? "The last message failed. Please regenerate the message to continue."
      : undefined);

  const sendChatMessage = (text: string) => {
    if (status !== "ready") {
      toast.error("Please wait for the chat to be ready");
      return;
    }
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }
    if (!text.trim()) {
      toast.error("Please enter a message");
      return;
    }
    void sendMessage({ text });
    setInput("");
  };

  const handleSubmit = ({ text }: { text: string }) => {
    sendChatMessage(text);
  };

  const handleSetModel = (model: LanguageModel) => {
    setModel(model);
    clientCookieUtils.setSelectedChatModel(
      `${model.provider}/${model.modelId}`
    );
  };

  const onSelectResource = (resource: SelectedResource) => {
    const newResources = [...selectedResources];
    const existingIndex = newResources.findIndex((r) => r.id === resource.id);
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
    addToolOutput,
  };
};
