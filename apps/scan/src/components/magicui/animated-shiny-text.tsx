import { cn } from "@/lib/utils";

import type { ComponentPropsWithoutRef, CSSProperties, FC } from "react";

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
      style={
        {
          ...style,
          "--shimmer-width": `${String(shimmerWidth)}px`,
        } as CSSProperties & Record<"--shimmer-width", string>
      }
      className={cn(
        "text-muted-foreground",

        // Shine effect
        "animate-shiny-text shiny-text-width bg-clip-text bg-no-repeat",

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
