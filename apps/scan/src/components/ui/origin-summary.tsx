import { cva, type VariantProps } from "class-variance-authority";

import { OriginAvatar } from "@/components/ui/origin-avatar";
import { cn } from "@/lib/utils";

import type { OriginAvatarProps } from "@/components/ui/origin-avatar";
import type { ComponentProps, ReactNode } from "react";

const originSummaryVariants = cva(
  "grid w-full min-w-0 max-w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3",
  {
    variants: {
      descriptionPlacement: {
        beside:
          "[&>[data-slot=origin-summary-avatar]]:row-start-1 has-data-[slot=origin-summary-description]:[&>[data-slot=origin-summary-avatar]]:row-span-2 has-data-[slot=origin-summary-metadata]:[&>[data-slot=origin-summary-avatar]]:row-span-2 has-data-[slot=origin-summary-description]:has-data-[slot=origin-summary-metadata]:[&>[data-slot=origin-summary-avatar]]:row-span-3",
        below:
          "gap-y-1 [&>[data-slot=origin-summary-avatar]]:row-start-1 [&>[data-slot=origin-summary-description]]:col-span-2 [&>[data-slot=origin-summary-description]]:col-start-1",
      },
    },
    defaultVariants: {
      descriptionPlacement: "beside",
    },
  }
);

const originSummaryNameVariants = cva("min-w-0", {
  variants: {
    variant: {
      "card-title": "type-card-title",
      label: "type-label",
      "page-title": "type-page-title",
      "section-title": "type-section-title",
    },
  },
  defaultVariants: {
    variant: "label",
  },
});

const textOverflowClassNames = {
  1: "truncate",
  2: "line-clamp-2 wrap-break-word whitespace-normal",
  none: "wrap-break-word whitespace-normal",
} as const;

interface OriginSummaryProps
  extends
    Omit<ComponentProps<"div">, "children">,
    VariantProps<typeof originSummaryVariants> {
  children: ReactNode;
}

type OriginSummaryNameProps = ComponentProps<"div"> &
  VariantProps<typeof originSummaryNameVariants> & {
    lines?: keyof typeof textOverflowClassNames;
  };

type OriginSummaryTextProps = ComponentProps<"div"> & {
  lines?: keyof typeof textOverflowClassNames;
};

function OriginSummary({
  children,
  className,
  descriptionPlacement = "beside",
  ...props
}: OriginSummaryProps) {
  return (
    <div
      {...props}
      className={cn(originSummaryVariants({ descriptionPlacement }), className)}
      data-description-placement={descriptionPlacement}
      data-slot="origin-summary"
    >
      {children}
    </div>
  );
}

function OriginSummaryAvatar({ className, ...props }: OriginAvatarProps) {
  return (
    <div
      className="col-start-1 shrink-0 self-center"
      data-slot="origin-summary-avatar"
    >
      <OriginAvatar className={className} {...props} />
    </div>
  );
}

function OriginSummaryHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="origin-summary-header"
      className={cn(
        "col-start-2 row-start-1 flex min-w-0 items-center gap-1.5",
        className
      )}
      {...props}
    />
  );
}

function OriginSummaryName({
  className,
  lines = 1,
  variant = "label",
  ...props
}: OriginSummaryNameProps) {
  return (
    <div
      data-slot="origin-summary-name"
      className={cn(
        originSummaryNameVariants({ variant }),
        textOverflowClassNames[lines],
        className
      )}
      {...props}
    />
  );
}

function OriginSummaryTrailing({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="origin-summary-trailing"
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

function OriginSummaryDescription({
  className,
  lines = 1,
  ...props
}: OriginSummaryTextProps) {
  return (
    <div
      data-slot="origin-summary-description"
      className={cn(
        "col-start-2 type-caption text-muted-foreground",
        textOverflowClassNames[lines],
        className
      )}
      {...props}
    />
  );
}

function OriginSummaryMetadata({
  className,
  lines = 1,
  ...props
}: OriginSummaryTextProps) {
  return (
    <div
      data-slot="origin-summary-metadata"
      className={cn(
        "col-start-2 type-caption text-muted-foreground/70",
        textOverflowClassNames[lines],
        className
      )}
      {...props}
    />
  );
}

export {
  OriginSummary,
  OriginSummaryAvatar,
  OriginSummaryDescription,
  OriginSummaryHeader,
  OriginSummaryMetadata,
  OriginSummaryName,
  OriginSummaryTrailing,
};
export type {
  OriginSummaryNameProps,
  OriginSummaryProps,
  OriginSummaryTextProps,
};
