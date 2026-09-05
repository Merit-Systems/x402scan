import {
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { toast } from "sonner";
import { Fragment } from "react";
import { CopyIcon } from "lucide-react";

import type { TextUIPart } from "ai";

interface Props {
  part: TextUIPart;
  showActions: boolean;
}

export const TextPart: React.FC<Props> = ({ part, showActions }) => {
  return (
    <Fragment>
      <MessageContent>
        <MessageResponse>{part.text}</MessageResponse>
      </MessageContent>
      {showActions && (
        <MessageActions className="-mt-2">
          <MessageAction
            onClick={() =>
              void navigator.clipboard
                .writeText(part.text)
                .then(() => {
                  toast.success("Copied to clipboard");
                  return undefined;
                })
                .catch(() => {
                  toast.error("Failed to copy to clipboard");
                  return undefined;
                })
            }
            label="Copy"
          >
            <CopyIcon className="size-3" />
          </MessageAction>
        </MessageActions>
      )}
    </Fragment>
  );
};
