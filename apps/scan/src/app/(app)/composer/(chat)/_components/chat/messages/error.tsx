import { Button } from "@/components/ui/button";
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";

interface Props {
  onRegenerate: () => void;
  message: string;
}

export const ErrorState: React.FC<Props> = ({ message, onRegenerate }) => {
  return (
    <div className="flex w-fit max-w-full items-center gap-4 rounded-md border bg-transparent px-4 py-2">
      <div className="flex items-center gap-2">
        <AlertCircleIcon className="size-4 shrink-0 text-destructive" />
        <div>
          <h3 className="text-sm font-bold text-destructive">Error</h3>
          <p className="text-xs">
            {message ?? "You need to regenerate the message to continue."}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onRegenerate}>
        <RefreshCwIcon className="size-4" />
      </Button>
    </div>
  );
};
