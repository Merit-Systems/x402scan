import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import type { ChatStatus, ReasoningUIPart } from 'ai';

interface Props {
  part: ReasoningUIPart;
  status: ChatStatus;
  isLastPart: boolean;
  isLastMessage: boolean;
}

export const ReasoningPart: React.FC<Props> = ({
  part,
  status,
  isLastPart,
  isLastMessage,
}) => {
  return (
    <Reasoning
      className="w-full"
      isStreaming={status === 'streaming' && isLastPart && isLastMessage}
    >
      <ReasoningTrigger />
      <ReasoningContent>{part.text}</ReasoningContent>
    </Reasoning>
  );
};
