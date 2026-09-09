import { cn } from "@/lib/utils";

import type { ComponentProps } from "react";

function StatsCardGrid({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}
      {...props}
    />
  );
}

export { StatsCardGrid };
