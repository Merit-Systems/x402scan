import { Card } from "@/components/ui/card";

import { ConversationEmptyState } from "@/components/ai-elements/conversation";
import { Logo } from "@/components/ui/logo";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

const DEFAULT_ICON = (
  <Card className=" ">
    <Logo className="size-8 md:size-12" />
  </Card>
);

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "x402scan Composer",
  description = "A playground for building agents that use x402 resources",
  icon = DEFAULT_ICON,
}) => {
  return (
    <ConversationEmptyState
      icon={icon}
      title={title}
      description={description}
    />
  );
};
