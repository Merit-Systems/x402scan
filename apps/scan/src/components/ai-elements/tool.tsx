"use client";

import { Check, ChevronDownIcon, CircleDot, Loader2, X } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Code } from "@/components/ui/code";
import { Loading } from "@/components/ui/loading";
import { Skeleton } from "@/components/ui/skeleton";

import { z } from "zod";

import { Favicon } from "@/app/(app)/_components/favicon";
import { jsonObjectSchema } from "@/lib/json";
import { cleanExternalText } from "@/lib/utils";

import { JsonViewer } from "./json-viewer";

import { cn } from "@/lib/utils";

import type { ComponentProps, ReactNode } from "react";
import type { ToolUIPart } from "ai";
import type { RouterOutputs } from "@/trpc/client";

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
type JsonArray = JsonValue[];

const Tool = ({ className, ...props }: ComponentProps<typeof Collapsible>) => (
  <Collapsible
    className={cn("not-prose w-full rounded-md border", className)}
    {...props}
  />
);

const ToolHeader = ({
  className,
  state,
  resource,
  isResourceLoading,
  ...props
}: {
  state: ToolUIPart["state"];
  isResourceLoading: boolean;
  resource: RouterOutputs["public"]["resources"]["get"] | undefined;
  className?: string;
}) => {
  return (
    <CollapsibleTrigger
      className={cn(
        "flex w-full items-center justify-between gap-4 p-3 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-all duration-200 overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <Loading
          value={resource}
          isLoading={isResourceLoading ?? state === "input-streaming"}
          component={(resource) => (
            <Favicon
              url={resource.origin.favicon ?? null}
              className="size-6 rounded-md md:size-8"
            />
          )}
          loadingComponent={<Skeleton className="size-6 md:size-8" />}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Loading
            value={resource}
            isLoading={isResourceLoading ?? state === "input-streaming"}
            component={(resource) => (
              <div className="flex w-full items-center gap-2 overflow-hidden">
                <span className="truncate text-left font-mono text-xs font-semibold md:text-sm">
                  {resource.resource}
                </span>
                {state === "input-streaming" ? (
                  <Loader2 className="size-3 shrink-0 animate-spin" />
                ) : state === "input-available" ? (
                  <CircleDot className="size-3 shrink-0" />
                ) : state === "output-available" ? (
                  <Check className="size-3 shrink-0 text-green-600" />
                ) : state === "output-error" ? (
                  <X className="size-3 shrink-0 text-red-600" />
                ) : null}
              </div>
            )}
            loadingComponent={<Skeleton className="my-[3px] h-[14px] w-32" />}
            errorComponent={<p>Unknown resource</p>}
          />
          <Loading
            value={resource}
            isLoading={isResourceLoading ?? state === "input-streaming"}
            component={(resource) => (
              <span className="text-left text-[10px] text-muted-foreground md:text-xs">
                {cleanExternalText(
                  resource.accepts.find((accept) => accept.description)
                    ?.description ?? ""
                )}
              </span>
            )}
            loadingComponent={<Skeleton className="my-[2px] h-[12px] w-32" />}
            errorComponent={<p>Unknown resource</p>}
          />
        </div>
      </div>
      <ChevronDownIcon className="hidden size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 md:block" />
    </CollapsibleTrigger>
  );
};

const ToolContent = ({
  className,
  ...props
}: ComponentProps<typeof CollapsibleContent>) => (
  <CollapsibleContent
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in space-y-2 py-4 border-t",
      className
    )}
    {...props}
  />
);

const ToolInput = ({
  className,
  input,
  ...props
}: ComponentProps<"div"> & {
  input: ToolUIPart["input"];
}) => {
  // Tool inputs are JSON objects; parse the untyped value at the boundary.
  const parsedInput = jsonObjectSchema.safeParse(input);
  if (!parsedInput.success || Object.keys(parsedInput.data).length === 0) {
    return (
      <h4 className="font-mono text-xs font-medium text-muted-foreground uppercase">
        No Parameters
      </h4>
    );
  }
  return (
    <div className={cn("space-y-2 overflow-hidden", className)} {...props}>
      <h4 className="font-mono text-xs font-medium text-muted-foreground uppercase">
        Parameters
      </h4>
      <div className="rounded-md bg-muted">
        <JsonViewer data={parsedInput.data} />
      </div>
    </div>
  );
};

const ToolOutput = ({
  className,
  output,
  ...props
}: ComponentProps<"div"> & {
  output: ReactNode;
}) => {
  if (!output) {
    return null;
  }

  const parseOutput = (output: ReactNode) => {
    const text = z.string().safeParse(output);
    if (!text.success) {
      return { raw: output, parsed: null };
    }

    const trimmed = text.data.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return { raw: output, parsed: JSON.parse(trimmed) as JsonValue };
      } catch {
        return { raw: output, parsed: null };
      }
    }

    return { raw: output, parsed: null };
  };

  const result = output ? parseOutput(output) : { raw: null, parsed: null };
  const { raw, parsed } = result;

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <h4 className="font-mono text-xs font-medium text-muted-foreground uppercase">
        Result
      </h4>
      <div
        className={cn(
          "overflow-x-auto rounded-md text-xs [&_table]:w-full font-mono",
          "bg-muted text-foreground"
        )}
      >
        {parsed && <JsonViewer data={parsed} defaultCollapsed={true} />}
        {!parsed && raw && (
          <Code value={JSON.stringify(raw, null, 2)} lang="json" />
        )}
      </div>
    </div>
  );
};

export { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput };
