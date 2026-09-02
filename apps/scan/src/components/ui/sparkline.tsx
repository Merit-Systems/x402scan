import { useId } from "react";

import { cn } from "@/lib/utils";

interface SparklineProps {
  className?: string;
  values: readonly number[];
}

function Sparkline({ className, values }: SparklineProps) {
  const gradientId = useId();
  const max = Math.max(...values);

  if (values.length < 2 || max <= 0) {
    return (
      <div
        aria-hidden="true"
        data-slot="sparkline"
        className={cn("h-8 w-full", className)}
      />
    );
  }

  const step = 100 / (values.length - 1);
  const points = values.map((value, index) => {
    const x = index * step;
    const y = 30 - (value / max) * 28;

    return `${String(x)},${String(y)}`;
  });

  return (
    <svg
      aria-hidden="true"
      data-slot="sparkline"
      className={cn("block h-8 w-full text-primary", className)}
      preserveAspectRatio="none"
      viewBox="0 0 100 32"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#${gradientId})`}
        points={`0,32 ${points.join(" ")} 100,32`}
      />
      <polyline
        fill="none"
        points={points.join(" ")}
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const placeholderValues = [3, 5, 4, 7, 5, 8, 6, 9, 7, 8, 6, 7] as const;

function SparklineLoading({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-slot="sparkline-loading"
      className={cn(
        "h-8 w-full opacity-25 motion-safe:animate-pulse motion-reduce:animate-none",
        className
      )}
    >
      <Sparkline
        className="size-full text-muted-foreground"
        values={placeholderValues}
      />
    </div>
  );
}

export { Sparkline, SparklineLoading };
