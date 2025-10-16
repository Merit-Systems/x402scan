'use client';

import { VerifyWalletModal } from '@/app/_components/chat/verify-wallet-modal';
import { FundWalletModal } from '@/app/_components/chat/fund-wallet-modal';
import { ChatSelector } from '@/app/_components/chat/chat-selector';
import { AgentSelector } from '@/app/_components/chat/agent-selector';
import { Messages } from '@/app/_components/chat/messages';
import { PromptInputSection } from '@/app/_components/chat/prompt-input-section';
import { ChatLoadingSkeleton } from '@/app/_components/chat/chat-loading-skeleton';
import { useChat } from '@ai-sdk/react';
import { useChatSubmission } from '@/app/_hooks/use-chat-submission';
import { useAgentConfiguration } from '@/app/_hooks/use-agent-configuration';
import { useState } from 'react';
import type { ServerChatData } from '@/lib/server-data';
import type { Chat } from '@prisma/client';
import type { UIMessage } from 'ai';

export type ChatStatus =
  | 'streaming'
  | 'submitted'
  | 'awaiting-message'
  | 'ready'
  | 'error';

interface ChatProps {
  serverData: ServerChatData;
  chatId?: string;
}

interface ChatContentProps {
  currentChatId: string | undefined;
  currentChat: Chat | undefined;
  chatMessages: UIMessage[];
  isAuthed: boolean;
  showVerify: boolean;
  setShowVerify: (show: boolean) => void;
  usdcBalance: number | undefined;
  showFund: boolean;
  setShowFund: (show: boolean) => void;
  isNavigating: boolean;
  setIsNavigating: (navigating: boolean) => void;
}

const ChatContent = ({
  currentChatId,
  currentChat,
  chatMessages,
  isAuthed,
  showVerify,
  setShowVerify,
  usdcBalance,
  showFund,
  setShowFund,
  isNavigating,
  setIsNavigating,
}: ChatContentProps) => {
  // Agent configuration hook
  const agentConfig = useAgentConfiguration();

  // AI SDK useChat hook - initialized with latest messages from backend
  const { messages, sendMessage, status } = useChat({
    messages: chatMessages,
  });

  // Chat submission logic
  const {
    input,
    setInput,
    model,
    setModel,
    selectedTools,
    setSelectedTools,
    handleSubmit,
  } = useChatSubmission({
    isAuthed,
    currentChat,
    sendMessage: (message, options) => {
      void sendMessage(message, options);
    },
    agentConfig,
  });

  // Show loading skeleton when navigating between chats
  if (isNavigating) {
    return <ChatLoadingSkeleton />;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Fixed top navigation */}
      {isAuthed && (
        <div className="flex-shrink-0 bg-background border-b">
          <div className="mx-auto max-w-3xl px-6 py-4 space-y-3">
            <ChatSelector
              currentChatId={currentChatId ?? undefined}
              onNavigationStart={() => setIsNavigating(true)}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Agent:</span>
              <AgentSelector agentConfig={agentConfig} />
            </div>
          </div>
        </div>
      )}

      {/* Scrollable messages area - takes remaining space */}
      <Messages messages={messages} status={status} />

      {/* Fixed bottom prompt area */}
      <div className="flex-shrink-0 bg-background border-t">
        <div className="mx-auto max-w-3xl p-6">
          <PromptInputSection
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isAuthed={isAuthed}
            model={model}
            setModel={setModel}
            selectedTools={selectedTools}
            setSelectedTools={setSelectedTools}
            usdcBalance={usdcBalance}
            setShowFund={setShowFund}
            status={status}
          />
        </div>
      </div>

      <VerifyWalletModal
        open={!isAuthed && showVerify}
        onOpenChange={setShowVerify}
      />
      {isAuthed && (
        <FundWalletModal open={showFund} onOpenChange={setShowFund} />
      )}
    </div>
  );
};

const Chat = ({ serverData, chatId }: ChatProps) => {
  const [showFund, setShowFund] = useState(false);
  const [showVerify, setShowVerify] = useState(!serverData.isAuthed);
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <ChatContent
      currentChatId={chatId}
      currentChat={serverData.currentChat ?? undefined}
      chatMessages={serverData.chatMessages}
      isAuthed={serverData.isAuthed}
      showVerify={showVerify}
      setShowVerify={setShowVerify}
      usdcBalance={serverData.usdcBalance ?? undefined}
      showFund={showFund}
      setShowFund={setShowFund}
      isNavigating={isNavigating}
      setIsNavigating={setIsNavigating}
    />
  );
};

export default Chat;
