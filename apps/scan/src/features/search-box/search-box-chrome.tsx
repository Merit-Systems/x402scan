'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Flag, Gauge } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { KeyboardEvent, ReactNode, RefObject } from 'react';

import { Button } from '@/components/ui/button';
import { CommandInput } from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { formatLatency } from './helpers';

export interface SearchBoxBarAction {
  key?: string;
  label: string;
  muted?: boolean;
  onRun: () => void;
}

export function SearchBoxInputBar({
  actions,
  autoFocus,
  inputRef,
  isResultsMode,
  mobileAction,
  query,
  onBackToSuggestions,
  onBlur,
  onFocus,
  onKeyDown,
  onValueChange,
}: {
  actions: SearchBoxBarAction[];
  autoFocus: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  isResultsMode: boolean;
  mobileAction?: SearchBoxBarAction | null;
  query: string;
  onBackToSuggestions: () => void;
  onBlur: () => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onValueChange: (value: string) => void;
}) {
  const trailing =
    isResultsMode || mobileAction || actions.length > 0 ? (
      <>
        <div className="md:hidden">
          {isResultsMode ? (
            <MobileBackButton onBackToSuggestions={onBackToSuggestions} />
          ) : mobileAction ? (
            <MobileActionButton action={mobileAction} />
          ) : null}
        </div>
        <DesktopActionButtons actions={actions} />
      </>
    ) : null;

  return (
    <CommandInput
      ref={inputRef}
      autoFocus={autoFocus}
      spellCheck={false}
      value={query}
      onFocus={onFocus}
      onBlur={onBlur}
      onValueChange={onValueChange}
      onKeyDown={onKeyDown}
      placeholder="Search x402 servers and resources"
      enterKeyHint="search"
      containerClassName="h-12 rounded-md border bg-background px-3 shadow-xs transition-colors focus-within:border-ring/60 focus-within:ring-1 focus-within:ring-ring/20 dark:bg-card/70"
      className="h-12 text-sm md:text-sm"
      trailing={trailing}
    />
  );
}

function MobileBackButton({
  onBackToSuggestions,
}: {
  onBackToSuggestions: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Back to suggestions"
      onMouseDown={event => {
        event.preventDefault();
      }}
      onClick={onBackToSuggestions}
      className="inline-flex items-center gap-1.5 px-1 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" />
      <span>Back</span>
    </button>
  );
}

function MobileActionButton({ action }: { action: SearchBoxBarAction }) {
  return (
    <button
      type="button"
      aria-label={action.label}
      onMouseDown={event => {
        event.preventDefault();
      }}
      onClick={action.onRun}
      className="inline-flex items-center px-1 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {action.label}
    </button>
  );
}

function DesktopActionButtons({ actions }: { actions: SearchBoxBarAction[] }) {
  if (actions.length === 0) return null;

  return (
    <div className="hidden items-center gap-3 md:flex">
      {actions.map(action => (
        <DesktopActionButton
          key={`${action.key ?? 'tap'}:${action.label}`}
          action={action}
        />
      ))}
    </div>
  );
}

function DesktopActionButton({ action }: { action: SearchBoxBarAction }) {
  return (
    <button
      type="button"
      aria-label={action.label}
      onMouseDown={event => {
        event.preventDefault();
      }}
      onClick={action.onRun}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 px-1 py-1 text-[11px] transition-colors hover:text-foreground',
        action.muted ? 'text-muted-foreground/55' : 'text-muted-foreground/75'
      )}
    >
      {action.key ? (
        <kbd className="px-0 font-mono text-[11px] tracking-[0.08em] text-foreground/65">
          {action.key}
        </kbd>
      ) : null}
      <span>{action.label}</span>
    </button>
  );
}

export function SearchBoxPopover({
  children,
  open,
}: {
  children: ReactNode;
  open: boolean;
}) {
  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          data-search-box-popover
          className="absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-md border bg-card shadow-lg"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function SearchBoxTelemetry({
  autocompleteLatencyMs,
  autocompleteLoading,
  onReportBadResults,
  reported,
  searchLatencyMs,
  showSearchLatency = true,
  usingFallback,
}: {
  autocompleteLatencyMs: number | null;
  autocompleteLoading: boolean;
  onReportBadResults?: () => void;
  reported?: boolean;
  searchLatencyMs: number | null;
  showSearchLatency?: boolean;
  usingFallback: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-t px-4 py-2.5 text-left text-[11px] text-muted-foreground/80">
      <span className="flex min-w-0 items-center gap-2.5">
        <Gauge className="size-3.5 shrink-0 text-muted-foreground/60" />
        <LatencyMetric label="auto" latencyMs={autocompleteLatencyMs} />
        {showSearchLatency ? (
          <LatencyMetric label="search" latencyMs={searchLatencyMs} />
        ) : null}
      </span>
      <span className="flex items-center gap-3">
        <span
          className={cn(
            'text-[11px] uppercase tracking-[0.12em] transition-opacity',
            autocompleteLoading || usingFallback ? 'opacity-100' : 'opacity-0'
          )}
        >
          {usingFallback
            ? 'prefix cache'
            : autocompleteLoading
              ? 'warming'
              : 'ready'}
        </span>
        {onReportBadResults ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={
                  reported
                    ? 'Search feedback sent'
                    : 'Report bad search results'
                }
                onMouseDown={event => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  onReportBadResults();
                }}
                className="-mr-1 inline-flex size-6 cursor-pointer items-center justify-center rounded-full text-muted-foreground/55 transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {reported ? (
                  <Check className="size-3.5" />
                ) : (
                  <Flag className="size-3.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={3}>
              {reported ? 'Feedback sent' : 'Report bad results'}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </span>
    </div>
  );
}

export function SearchFeedbackDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (note: string) => void;
}) {
  const [note, setNote] = useState('');

  function updateOpen(nextOpen: boolean) {
    if (!nextOpen) {
      setNote('');
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={updateOpen}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(calc(100vw-2rem),25rem)] gap-0 overflow-hidden rounded-xl p-0 shadow-lg sm:max-w-none"
      >
        <form
          className="grid gap-4 p-4"
          onKeyDown={event => {
            if (event.key !== 'Escape') {
              event.stopPropagation();
            }
          }}
          onSubmit={event => {
            event.preventDefault();
            const submittedNote = note;
            setNote('');
            onSubmit(submittedNote);
          }}
        >
          <DialogHeader className="gap-1 pr-6">
            <DialogTitle className="text-sm leading-5 font-medium">
              Bad results?
            </DialogTitle>
            <DialogDescription className="text-xs leading-5 text-muted-foreground/80">
              Optional note. We also save the visible candidates.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={event => setNote(event.target.value)}
            maxLength={1000}
            placeholder="Wrong ranking, unrelated suggestions, missing resource..."
            className="min-h-20 resize-none rounded-lg bg-muted/30 px-3.5 py-3 text-sm shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-1"
          />
          <DialogFooter className="flex-row justify-end gap-2 pt-0">
            <Button
              type="button"
              variant="unstyled"
              onClick={() => updateOpen(false)}
              className="h-8 rounded-md px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="unstyled"
              className="h-8 rounded-md bg-foreground px-3.5 text-xs font-medium text-background shadow-xs transition-opacity hover:opacity-90"
            >
              Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LatencyMetric({
  label,
  latencyMs,
}: {
  label: string;
  latencyMs: number | null;
}) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      <span>{label}:</span>
      {latencyMs === null ? (
        <Skeleton className="h-2.5 w-8 rounded-full" />
      ) : (
        <span>{formatLatency(latencyMs)}</span>
      )}
    </span>
  );
}
