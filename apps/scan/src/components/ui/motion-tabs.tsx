"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useMemo,
  type ComponentProps,
  type ComponentRef,
  type ReactNode,
} from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type MotionIndicator = "both" | "box" | "line";

interface MotionTabsContextValue {
  indicator: MotionIndicator;
}

interface MotionToggleContextValue {
  indicator: MotionIndicator;
  onValueChange: (value: string) => void;
  value: string;
}

const MotionTabsContext = createContext<MotionTabsContextValue | null>(null);
const MotionToggleContext = createContext<MotionToggleContextValue | null>(
  null
);
const selectionTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.15,
} as const;

type MotionTabsListProps = Omit<ComponentProps<typeof TabsList>, "variant"> & {
  indicator?: MotionIndicator;
};

const MotionTabsList = forwardRef<
  ComponentRef<typeof TabsList>,
  MotionTabsListProps
>(function MotionTabsList(
  { children, className, indicator = "both", ...props },
  ref
) {
  const layoutId = useId();
  const contextValue = useMemo(() => ({ indicator }), [indicator]);

  return (
    <LayoutGroup id={layoutId}>
      <MotionTabsContext.Provider value={contextValue}>
        <TabsList ref={ref} variant="motion" className={className} {...props}>
          {children}
        </TabsList>
      </MotionTabsContext.Provider>
    </LayoutGroup>
  );
});

type MotionTabTriggerProps = Omit<
  ComponentProps<typeof TabsTrigger>,
  "children" | "value"
> & {
  children: ReactNode;
  isActive: boolean;
  value: string;
};

const MotionTabTrigger = forwardRef<
  ComponentRef<typeof TabsTrigger>,
  MotionTabTriggerProps
>(function MotionTabTrigger(
  { children, className, isActive, value, ...props },
  ref
) {
  const context = useContext(MotionTabsContext);
  const indicator = context?.indicator ?? "both";

  return (
    <TabsTrigger
      ref={ref}
      value={value}
      appearance={indicator === "box" ? "motion-box" : "motion-line"}
      className={className}
      {...props}
    >
      <SelectionLabel indicator={indicator} isActive={isActive}>
        {children}
      </SelectionLabel>
    </TabsTrigger>
  );
});

type MotionToggleGroupProps = Omit<ComponentProps<"div">, "onChange"> & {
  indicator?: MotionIndicator;
  onValueChange: (value: string) => void;
  value: string;
};

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Toggle buttons need a generic named group; fieldset would add form semantics. */
const MotionToggleGroup = forwardRef<HTMLDivElement, MotionToggleGroupProps>(
  function MotionToggleGroup(
    { children, className, indicator = "box", onValueChange, value, ...props },
    ref
  ) {
    const layoutId = useId();
    const contextValue = useMemo(
      () => ({ indicator, onValueChange, value }),
      [indicator, onValueChange, value]
    );

    return (
      <LayoutGroup id={layoutId}>
        <MotionToggleContext.Provider value={contextValue}>
          <div
            ref={ref}
            role="group"
            data-slot="motion-toggle-group"
            className={cn(
              "relative inline-flex flex-wrap items-center gap-1",
              className
            )}
            {...props}
          >
            {children}
          </div>
        </MotionToggleContext.Provider>
      </LayoutGroup>
    );
  }
);
/* oxlint-enable jsx-a11y/prefer-tag-over-role */

type MotionToggleItemProps = Omit<
  ComponentProps<typeof Button>,
  "children" | "variant"
> & {
  children: ReactNode;
  value: string;
};

const MotionToggleItem = forwardRef<
  ComponentRef<typeof Button>,
  MotionToggleItemProps
>(function MotionToggleItem(
  { children, className, onClick, size, value, ...props },
  ref
) {
  const context = useContext(MotionToggleContext);

  if (!context) {
    throw new Error("MotionToggleItem must be used within MotionToggleGroup");
  }

  const isActive = context.value === value;
  const resolvedSize =
    size ?? (context.indicator === "box" ? "motion-box" : "motion-line");

  return (
    <Button
      ref={ref}
      type="button"
      data-slot="motion-toggle-item"
      aria-pressed={isActive}
      variant="motion"
      size={resolvedSize}
      className={cn("relative z-10 active:translate-y-0", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) context.onValueChange(value);
      }}
      {...props}
    >
      <SelectionLabel indicator={context.indicator} isActive={isActive}>
        {children}
      </SelectionLabel>
    </Button>
  );
});

function SelectionLabel({
  children,
  indicator,
  isActive,
}: {
  children: ReactNode;
  indicator: MotionIndicator;
  isActive: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const transition = shouldReduceMotion
    ? ({ duration: 0 } as const)
    : selectionTransition;

  return (
    <>
      <span className="relative z-10 inline-flex h-7 items-center rounded-md px-2">
        {(indicator === "box" || indicator === "both") && isActive ? (
          <motion.span
            layoutId="active"
            className="absolute inset-0 -z-10 rounded-md bg-muted"
            transition={transition}
          />
        ) : null}
        <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
          {children}
        </span>
      </span>
      {(indicator === "line" || indicator === "both") && isActive ? (
        <motion.span
          layoutId="underline"
          className="absolute inset-x-0 bottom-0 h-px rounded-full bg-foreground"
          transition={transition}
        />
      ) : null}
    </>
  );
}

export {
  MotionTabsList,
  MotionTabTrigger,
  MotionToggleGroup,
  MotionToggleItem,
};
export type { MotionIndicator };
