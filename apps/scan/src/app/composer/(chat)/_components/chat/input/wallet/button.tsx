import { PromptInputButton } from '@/components/ai-elements/prompt-input';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot } from 'lucide-react';

interface Props {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const WalletButton: React.FC<Props> = ({
  children,
  onClick,
  className,
}) => {
  return (
    <PromptInputButton
      variant="outline"
      size="sm"
      onClick={onClick}
      className={className}
    >
      <Bot className="size-4" />
      <div className="text-xs">{children}</div>
    </PromptInputButton>
  );
};

export const LoadingWalletButton = () => {
  return (
    <PromptInputButton variant="outline" size="sm">
      <Bot className="size-4" />
      <Skeleton className="h-3 w-8" />
    </PromptInputButton>
  );
};
