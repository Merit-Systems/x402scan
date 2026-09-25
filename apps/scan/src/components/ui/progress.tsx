"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";

import * as React from "react";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "progress-indicator bg-primary flex-1 transition-all size-full",
          indicatorClassName
        )}
        style={
          {
            "--progress-offset": `-${String(100 - (value ?? 0))}%`,
          } as React.CSSProperties & Record<"--progress-offset", string>
        }
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
