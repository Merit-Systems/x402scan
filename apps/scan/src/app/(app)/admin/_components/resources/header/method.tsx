import React from "react";

import { cn } from "@/lib/utils";
import { Methods } from "@/types/x402";

import type { BazaarMethod } from "@/types/x402";

interface Props {
  method?: BazaarMethod;
}

export const Method: React.FC<Props> = ({ method }) => {
  const undefinedMethodClassName = "bg-muted text-muted-foreground";

  const methodClassName = {
    [Methods.GET]: "bg-success-subtle text-success",
    [Methods.POST]: "bg-information-subtle text-information",
    [Methods.PUT]: "bg-warning-subtle text-warning",
    [Methods.DELETE]: "bg-destructive-subtle text-destructive",
    [Methods.PATCH]: "bg-primary/10 text-primary",
    OPTIONS: undefinedMethodClassName,
    HEAD: undefinedMethodClassName,
  } satisfies Record<BazaarMethod, string>;

  return (
    <div
      className={cn(
        "type-mono type-scale-caption rounded-md px-1",
        method ? methodClassName[method] : undefinedMethodClassName
      )}
    >
      {method?.toUpperCase() ?? "UNKNOWN"}
    </div>
  );
};
