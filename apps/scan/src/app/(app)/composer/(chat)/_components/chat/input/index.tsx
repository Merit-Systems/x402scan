"use client";

import { useSession } from "next-auth/react";

import { Skeleton } from "@/components/ui/skeleton";

import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";

import type { PromptInputProps } from "@/components/ai-elements/prompt-input";

import { ModelSelect } from "./model-select";
import { ResourcesSelect } from "./resources-select";
import { WalletButton } from "./wallet";

import type { ChatStatus } from "ai";
import type { SelectedResource } from "../../../../_types/chat-config";
import type { LanguageModel } from "../../../_lib/language-models/types";

interface Props {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: PromptInputProps["onSubmit"];
  model: LanguageModel;
  setModel: (value: LanguageModel) => void;
  selectedResources: SelectedResource[];
  onSelectResource: (resource: SelectedResource) => void;
  status: ChatStatus;
  errorMessage: string | undefined;
}

export const PromptInputSection: React.FC<Props> = ({
  input,
  setInput,
  handleSubmit,
  model,
  setModel,
  selectedResources,
  onSelectResource,
  status,
  errorMessage,
}) => {
  const { data: session, status: sessionStatus } = useSession();

  return (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setInput(e.target.value);
        }}
        value={input}
        placeholder={
          sessionStatus !== "loading" && !session
            ? "Sign in to use the composer"
            : undefined
        }
      />
      <PromptInputFooter>
        <PromptInputTools>
          <ModelSelect model={model} setModel={setModel} />
          <ResourcesSelect
            resources={selectedResources}
            onSelectResource={onSelectResource}
          />
          <WalletButton />
        </PromptInputTools>
        <PromptInputSubmit
          disabled={!input || status !== "ready" || !!errorMessage}
          className="size-8 md:size-8"
        />
      </PromptInputFooter>
    </PromptInput>
  );
};

export const LoadingPromptInputSection = () => {
  return (
    <PromptInput onSubmit={() => undefined}>
      <PromptInputTextarea disabled />
      <PromptInputFooter>
        <PromptInputTools>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </PromptInputTools>
        <Skeleton className="size-8" />
      </PromptInputFooter>
    </PromptInput>
  );
};
