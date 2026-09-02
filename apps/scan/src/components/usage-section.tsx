import { cn } from "@/lib/utils";

import type { ComponentProps, ReactNode } from "react";

function UsageSection({
  children,
  className,
  controls,
  ...props
}: ComponentProps<"section"> & { controls?: ReactNode }) {
  return (
    <section className={cn("space-y-4", className)} {...props}>
      <div className="flex flex-row justify-between gap-4">
        <h2 className="type-section-title">Usage</h2>
        {controls}
      </div>
      {children}
    </section>
  );
}

export { UsageSection };
