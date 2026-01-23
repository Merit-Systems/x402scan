import { Card } from '@/components/ui/card';

import { ConversationEmptyState } from '@/components/ai-elements/conversation';
import { Logo } from '@/components/logo';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  button?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'x402scan Composer',
  description = 'A playground for building agents that use x402 resources',
  icon = (
    <Card className="p-2 border-primary/70 shadow-[0_0_4px_0px_color-mix(in_oklch,var(--primary)_70%,transparent)]">
      <Logo className="size-8 md:size-12" />
    </Card>
  ),
  button,
}) => {
  return (
    <ConversationEmptyState
      icon={icon}
      title={title}
      description={description}
      button={button}
    />
  );
};
