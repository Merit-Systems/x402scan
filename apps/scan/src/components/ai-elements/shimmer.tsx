"use client";

/* oxlint-disable hooks/static-components, typescript/no-unnecessary-condition, typescript/no-unsafe-type-assertion, typescript/restrict-template-expressions -- AI Elements supports a caller-selected intrinsic motion element. */

import { cn } from "@/lib/utils";
import { LazyMotion, domAnimation, m } from "motion/react";
import {
  type CSSProperties,
  type ElementType,
  type JSX,
  memo,
  useMemo,
} from "react";

interface TextShimmerProps {
  children: string;
  as?: ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

const ShimmerComponent = ({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) => {
  const MotionComponent = m.create(Component as keyof JSX.IntrinsicElements);

  const dynamicSpread = useMemo(
    () => (children?.length ?? 0) * spread,
    [children, spread]
  );

  return (
    <LazyMotion features={domAnimation}>
      <MotionComponent
        animate={{ backgroundPosition: "0% center" }}
        className={cn(
          "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent w-fit",
          "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-foreground),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
          className
        )}
        initial={{ backgroundPosition: "100% center" }}
        style={
          {
            "--spread": `${dynamicSpread}px`,
            backgroundImage:
              "var(--bg), linear-gradient(color-mix(in oklab, var(--color-muted-foreground) 60%, transparent), color-mix(in oklab, var(--color-muted-foreground) 60%, transparent))",
          } as CSSProperties
        }
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration,
          ease: "linear",
        }}
      >
        {children}
      </MotionComponent>
    </LazyMotion>
  );
};

export const Shimmer = memo(ShimmerComponent);
