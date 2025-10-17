import { MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { toast } from 'sonner';
import { Fragment } from 'react';
import { Action, Actions } from '@/components/ai-elements/actions';
import { CopyIcon } from 'lucide-react';

import type { TextUIPart } from 'ai';

interface Props {
  part: TextUIPart;
  showActions: boolean;
}

export const TextPart: React.FC<Props> = ({ part, showActions }) => {
  return (
    <Fragment>
      <MessageContent>
        <Response>{part.text}</Response>
      </MessageContent>
      {showActions && (
        <Actions className="-mt-2">
          <Action
            onClick={() =>
              navigator.clipboard
                .writeText(part.text)
                .then(() => {
                  toast.success('Copied to clipboard');
                })
                .catch(() => {
                  toast.error('Failed to copy to clipboard');
                })
            }
            label="Copy"
          >
            <CopyIcon className="size-3" />
          </Action>
        </Actions>
      )}
    </Fragment>
  );
};
