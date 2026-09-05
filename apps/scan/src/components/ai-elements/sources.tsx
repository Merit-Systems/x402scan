"use client";

import { BookIcon, ChevronDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const Sources = ({ className, ...props }: ComponentProps<"div">) => (
  <Collapsible className={cn("mb-4", className)} {...props} />
);

const SourcesTrigger = ({
  className,
  count,
  children,
  ...props
}: ComponentProps<typeof CollapsibleTrigger> & {
  count: number;
}) => (
  <CollapsibleTrigger
    className={cn("flex items-center gap-2", className)}
    {...props}
  >
    {children ?? (
      <>
        <p className="type-label text-primary">Used {count} sources</p>
        <ChevronDownIcon className="size-4" />
      </>
    )}
  </CollapsibleTrigger>
);

const SourcesContent = ({
  className,
  ...props
}: ComponentProps<typeof CollapsibleContent>) => (
  <CollapsibleContent
    className={cn("mt-3 flex w-fit flex-col gap-2", className)}
    {...props}
  />
);

const Source = ({ href, title, children, ...props }: ComponentProps<"a">) => (
  <a
    className="flex items-center gap-2"
    href={href}
    rel="noreferrer"
    target="_blank"
    {...props}
  >
    {children ?? (
      <>
        <BookIcon className="size-4" />
        <span className="block type-label">{title}</span>
      </>
    )}
  </a>
);

export { Sources, SourcesTrigger, SourcesContent, Source };
