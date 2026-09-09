import * as React from "react";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

import { BorderBeam } from "./border-beam";

type X402V2BadgeProps = React.HTMLAttributes<HTMLDivElement>;

export function X402V2Badge({ className, ...props }: X402V2BadgeProps) {
  return (
    <Badge
      variant="default"
      className={cn("relative size-fit shrink-0 overflow-hidden", className)}
      {...props}
    >
      v2
      <BorderBeam
        size={30}
        colorFrom="rgba(255, 255, 255, 0)"
        colorTo="rgba(255, 255, 255)"
      />
    </Badge>
  );
}
