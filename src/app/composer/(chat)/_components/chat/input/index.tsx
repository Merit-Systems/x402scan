'use client';

import { useSession } from 'next-auth/react';

import { Skeleton } from '@/components/ui/skeleton';

import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';

import { ModelSelect } from './model-select';
import { ResourcesSelect } from './resources-select';
import { WalletButton } from './wallet';

import { api } from '@/trpc/client';

import type { ChatStatus } from 'ai';
import type { SelectedResource } from '../../../_types/chat-config';
import type { LanguageModel } from './model-select/types';

interface Props {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  model: LanguageModel;
  setModel: (value: LanguageModel) => void;
  selectedResources: SelectedResource[];
  onSelectResource: (resource: SelectedResource) => void;
  status: ChatStatus;
}

export const PromptInputSection: React.FC<Props> = ({
  input,
  setInput,
  handleSubmit,
  model,
  setModel,
  selectedResources,
  onSelectResource,
}) => {
  const { data: session } = useSession();

  const { data: usdcBalance, isLoading: isUsdcBalanceLoading } =
    api.user.serverWallet.usdcBaseBalance.useQuery(undefined, {
      enabled: !!session,
    });
  const { data: freeTierUsage, isLoading: isFreeTierUsageLoading } =
    api.user.freeTier.usage.useQuery(undefined, {
      enabled: !!session,
    });

  const isLoading = isUsdcBalanceLoading || isFreeTierUsageLoading;

  const hasBalance = (usdcBalance ?? 0) > 0 || freeTierUsage?.hasFreeTier;

  return (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setInput(e.target.value)
        }
        value={input}
        disabled={!hasBalance}
        placeholder={
          !isLoading && !hasBalance
            ? 'Add funds to your agent to continue'
            : undefined
        }
      />
      <PromptInputToolbar>
        <PromptInputTools>
          <ModelSelect model={model} setModel={setModel} />
          <ResourcesSelect
            resources={selectedResources}
            onSelectResource={onSelectResource}
          />
          <WalletButton />
        </PromptInputTools>
        <PromptInputSubmit
          disabled={!input || !hasBalance}
          className="size-8 md:size-8"
        />
      </PromptInputToolbar>
    </PromptInput>
  );
};

export const LoadingPromptInputSection = () => {
  return (
    <PromptInput>
      <PromptInputTextarea disabled />
      <PromptInputToolbar>
        <PromptInputTools>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </PromptInputTools>
        <Skeleton className="size-8" />
      </PromptInputToolbar>
    </PromptInput>
  );
};
