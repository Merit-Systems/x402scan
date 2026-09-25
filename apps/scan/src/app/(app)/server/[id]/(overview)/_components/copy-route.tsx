"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

interface CopyRouteProps {
  resourceUrl: string;
  route: string;
}

export function CopyRoute({ resourceUrl, route }: CopyRouteProps) {
  const { copyToClipboard } = useCopyToClipboard();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              aria-label={`Copy route ${route}`}
              className="text-left wrap-anywhere"
              onClick={() => void copyToClipboard(resourceUrl)}
              size="none"
              type="button"
              variant="plain"
            />
          }
        >
          <code className="type-code opacity-90 group-hover/button:opacity-100">
            {route}
          </code>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4}>
          Copy
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
