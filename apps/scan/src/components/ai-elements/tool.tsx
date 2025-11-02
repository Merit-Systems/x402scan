'use client';

import type { ToolUIPart } from 'ai';
import { Check, ChevronDownIcon, Loader2, X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { JsonViewer } from './json-viewer';
import { Code } from '../ui/code';
import type { RouterOutputs } from '@/trpc/client';
import { Skeleton } from '../ui/skeleton';
import { Favicon } from '../../app/_components/favicon';
import { Loading } from '../ui/loading';
import { formatTokenAmount } from '@/lib/token';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

const Tool = ({ className, ...props }: ComponentProps<typeof Collapsible>) => (
  <Collapsible
    className={cn('not-prose w-full rounded-md border', className)}
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
  state: ToolUIPart['state'];
  isResourceLoading: boolean;
  resource: RouterOutputs['public']['resources']['get'] | undefined;
  className?: string;
}) => {
  return (
    <CollapsibleTrigger
      className={cn(
        'flex w-full items-center justify-between gap-4 p-3 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-all duration-200 overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 flex-1 overflow-hidden">
        <Loading
          value={resource}
          isLoading={isResourceLoading ?? state === 'input-streaming'}
          component={resource => (
            <Favicon
              url={resource.origin.favicon ?? null}
              className="size-6 md:size-8 rounded-md"
            />
          )}
          loadingComponent={<Skeleton className="size-6 md:size-8" />}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Loading
            value={resource}
            isLoading={isResourceLoading ?? state === 'input-streaming'}
            component={resource => (
              <div className="flex items-center gap-2 w-full overflow-hidden">
                <span className="font-semibold text-xs md:text-sm font-mono text-left truncate">
                  {resource.resource}
                </span>
                <span className="text-xs md:text-sm font-semibold text-primary font-mono">
                  {formatTokenAmount(resource.accepts[0].maxAmountRequired)}
                </span>
                {state === 'output-available' ? (
                  <Check className="size-3 text-green-600" />
                ) : state === 'output-error' ? (
                  <X className="size-3 text-red-600" />
                ) : (
                  <Loader2 className="size-3 animate-spin" />
                )}
              </div>
            )}
            loadingComponent={<Skeleton className="h-[14px] my-[3px] w-32" />}
            errorComponent={<p>Unknown resource</p>}
          />
          <Loading
            value={resource}
            isLoading={isResourceLoading ?? state === 'input-streaming'}
            component={resource => (
              <span className="text-[10px] md:text-xs text-muted-foreground text-left">
                {resource.accepts[0].description}
              </span>
            )}
            loadingComponent={<Skeleton className="h-[12px] my-[2px] w-32" />}
            errorComponent={<p>Unknown resource</p>}
          />
        </div>
      </div>
      <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 hidden md:block" />
    </CollapsibleTrigger>
  );
};

const ToolContent = ({
  className,
  ...props
}: ComponentProps<typeof CollapsibleContent>) => (
  <CollapsibleContent
    className={cn(
      'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in space-y-2 py-4 border-t',
      className
    )}
    {...props}
  />
);

const ToolInput = ({
  className,
  input,
  ...props
}: ComponentProps<'div'> & {
  input: ToolUIPart['input'];
}) => (
  <div className={cn('space-y-2 overflow-hidden px-4', className)} {...props}>
    <h4 className="font-medium text-muted-foreground text-xs uppercase font-mono">
      Parameters
    </h4>
    <div className="rounded-md bg-muted">
      <JsonViewer data={input as JsonValue} />
    </div>
  </div>
);

const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ComponentProps<'div'> & {
  output: ReactNode;
  errorText: ToolUIPart['errorText'];
}) => {
  if (!(output || errorText)) {
    return null;
  }

  const parseOutput = (output: ReactNode) => {
    if (typeof output !== 'string') {
      return { raw: output, parsed: null };
    }

    const trimmed = output.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
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
    <div className={cn('space-y-2 px-4', className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase font-mono">
        {errorText ? 'Error' : 'Result'}
      </h4>
      <div
        className={cn(
          'overflow-x-auto rounded-md text-xs [&_table]:w-full font-mono',
          errorText
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted text-foreground'
        )}
      >
        {errorText && <div className="p-3">{errorText}</div>}
        {parsed && <JsonViewer data={parsed} defaultCollapsed={true} />}
        {!parsed && raw && (
          <Code value={JSON.stringify(raw, null, 2)} lang="json" />
        )}
      </div>
    </div>
  );
};

export { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput };
