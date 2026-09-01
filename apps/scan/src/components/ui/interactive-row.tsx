"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

const interactiveRowVariants = cva(
  "relative isolate transition-colors outline-none before:pointer-events-none before:absolute before:-top-px before:-right-4 before:-bottom-px before:-left-4 before:-z-10 before:rounded-lg before:border before:border-transparent before:bg-transparent before:transition-colors before:content-[''] hover:before:border-border hover:before:bg-muted/50 focus-visible:before:border-ring focus-visible:before:bg-muted/50",
  {
    variants: {
      control: {
        true: "h-auto w-full min-w-0 justify-start rounded-none border-none px-0 text-left whitespace-normal type-supporting-body hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0",
      },
    },
  }
);

const interactiveTableRowClassName =
  "isolate cursor-pointer outline-none [&>td]:relative [&>td]:isolate [&>td]:transition-colors [&>td]:before:pointer-events-none [&>td]:before:absolute [&>td]:before:z-0 [&>td]:before:inset-x-0 [&>td]:before:-inset-y-px [&>td]:before:border-y [&>td]:before:border-transparent [&>td]:before:bg-transparent [&>td]:before:transition-[left,right,background-color,border-color] [&>td]:before:content-[''] [&>td:first-child]:before:rounded-l-lg [&>td:first-child]:before:border-l [&>td:last-child]:before:rounded-r-lg [&>td:last-child]:before:border-r hover:[&>td]:before:border-border hover:[&>td]:before:bg-muted/50 hover:[&>td:first-child]:before:-left-4 hover:[&>td:last-child]:before:-right-4 focus-visible:[&>td]:before:border-ring focus-visible:[&>td]:before:bg-muted/50 focus-visible:[&>td:first-child]:before:-left-4 focus-visible:[&>td:last-child]:before:-right-4 has-[:focus-visible]:[&>td]:before:border-ring has-[:focus-visible]:[&>td]:before:bg-muted/50 has-[:focus-visible]:[&>td:first-child]:before:-left-4 has-[:focus-visible]:[&>td:last-child]:before:-right-4";

type InteractiveRowProps = Omit<ComponentProps<typeof Button>, "variant"> &
  VariantProps<typeof interactiveRowVariants>;

function InteractiveRow({
  className,
  control = true,
  ...props
}: InteractiveRowProps) {
  return (
    <Button
      className={interactiveRowVariants({ className, control })}
      variant="ghost"
      {...props}
    />
  );
}

export { InteractiveRow, interactiveRowVariants, interactiveTableRowClassName };
export type { InteractiveRowProps };
