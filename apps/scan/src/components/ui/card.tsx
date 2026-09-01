import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "group/card type-supporting-body flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] data-[size=sm]:[--card-spacing:--spacing(3)] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
  {
    variants: {
      variant: {
        default: null,
        muted: "bg-muted/50",
        popover: "py-0 shadow-md",
        currency:
          "gap-3 border-border bg-transparent p-4 transition-all duration-200 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/20",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Card({
  className,
  size = "default",
  variant,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl p-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] has-[+[data-slot=card-footer]]:pb-0",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "type-card-title group-data-[size=sm]/card:type-label",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("type-supporting-body text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-(--card-spacing) pt-(--card-content-padding-top) pb-(--card-content-padding-bottom) [--card-content-padding-bottom:var(--card-spacing)] [--card-content-padding-top:var(--card-spacing)] group-has-data-[slot=card-header]/card:first:[--card-content-padding-top:0px] group-has-data-[slot=card-footer]/card:last:[--card-content-padding-bottom:0px] has-[+[data-slot=card-footer]]:[--card-content-padding-bottom:0px] [[data-slot=card-content]+&]:[--card-content-padding-top:0px] [[data-slot=card-header]+&]:[--card-content-padding-top:0px]",
        className
      )}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
