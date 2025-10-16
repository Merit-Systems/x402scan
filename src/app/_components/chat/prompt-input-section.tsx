'use client';

import { Wallet } from 'lucide-react';
import {
  PromptInput,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputButton,
} from '@/app/_components/chat/ai-elements/prompt-input';
import { ToolSelector } from '@/app/_components/chat/tool-selector';
import type { ChatStatus } from '@/app/_components/chat/chat';

const models = [
  {
    name: 'GPT 4o',
    value: 'gpt-4o',
  },
  {
    name: 'GPT 5',
    value: 'gpt-5',
  },
];

interface PromptInputSectionProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isAuthed: boolean;
  model: string;
  setModel: (value: string) => void;
  selectedTools: string[];
  setSelectedTools: (value: string[]) => void;
  usdcBalance: number | undefined;
  setShowFund: (value: boolean) => void;
  status: ChatStatus;
}

export const PromptInputSection = ({
  input,
  setInput,
  handleSubmit,
  isAuthed,
  model,
  setModel,
  selectedTools,
  setSelectedTools,
  usdcBalance,
  setShowFund,
}: PromptInputSectionProps) => {
  return (
    <div>

      <PromptInput onSubmit={handleSubmit} className="mt-4">
        <PromptInputTextarea
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setInput(e.target.value)
          }
          value={input}
          disabled={!isAuthed}
          placeholder={isAuthed ? undefined : 'Sign in to chat'}
        />
        <PromptInputToolbar>
          <PromptInputTools
            className={!isAuthed ? 'pointer-events-none opacity-50' : undefined}
          >
            <PromptInputModelSelect
              onValueChange={value => {
                setModel(value);
              }}
              value={model}
            >
              <PromptInputModelSelectTrigger disabled={!isAuthed}>
                <PromptInputModelSelectValue />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                {models.map(model => (
                  <PromptInputModelSelectItem
                    key={model.value}
                    value={model.value}
                  >
                    {model.name}
                  </PromptInputModelSelectItem>
                ))}
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>
            <PromptInputButton
              onClick={() => setShowFund(true)}
              disabled={!isAuthed}
              aria-label="Fund wallet"
            >
              <Wallet className="size-4" />${usdcBalance?.toPrecision(3)} USDC
            </PromptInputButton>
            <ToolSelector
              selectedTools={selectedTools}
              onToolsChange={setSelectedTools}
            />
          </PromptInputTools>
          <PromptInputSubmit disabled={!input || !isAuthed} />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
};
