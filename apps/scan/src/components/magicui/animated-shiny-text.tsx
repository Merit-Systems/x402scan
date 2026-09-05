import type { ComponentPropsWithoutRef, FC } from "react";

import { cn } from "@/lib/utils";

type AnimatedShinyTextProps = {
  shimmerWidth?: number;
} & ComponentPropsWithoutRef<"span">;

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 100,
  style,
  ...props
}) => {
  return (
    <span
      style={{ ...style, backgroundSize: `${String(shimmerWidth)}px 100%` }}
      className={cn(
        "text-muted-foreground",

        // Shine effect
        "animate-shiny-text bg-clip-text [background-position:0_0] bg-no-repeat [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]",

        // Shine gradient
        "bg-linear-to-r from-transparent via-foreground/80 via-50% to-transparent",

        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
