import { ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ResourceVerificationBadgeProps {
  verifiedAccepts: number;
  totalAccepts: number;
  compact?: boolean;
  className?: string;
}

/**
 * Display verification status for a resource based on its accepts.
 * Shows three states:
 * - Verified (all accepts verified)
 * - Partially Verified (some accepts verified)
 * - Unverified (no accepts verified)
 */
export function ResourceVerificationBadge({
  verifiedAccepts,
  totalAccepts,
  compact = false,
  className,
}: ResourceVerificationBadgeProps) {
  const allVerified = totalAccepts > 0 && verifiedAccepts === totalAccepts;
  const partiallyVerified = verifiedAccepts > 0 && verifiedAccepts < totalAccepts;
  const unverified = verifiedAccepts === 0;

  // Verified state
  if (allVerified) {
    if (compact) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <ShieldCheck className={cn('size-4 text-green-600', className)} />
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Verified</p>
            <p className="text-muted-foreground">
              All payment addresses are verified
            </p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-600/10 border border-green-600/30 rounded-full px-2 py-0.5',
          className
        )}
      >
        <ShieldCheck className="size-3" />
        Verified
      </span>
    );
  }

  // Partially verified state
  if (partiallyVerified) {
    if (compact) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <ShieldAlert className={cn('size-4 text-yellow-600', className)} />
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Partially Verified</p>
            <p className="text-muted-foreground">
              {verifiedAccepts} of {totalAccepts} payment addresses verified
            </p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-600/10 border border-yellow-600/30 rounded-full px-2 py-0.5 cursor-help',
              className
            )}
          >
            <ShieldAlert className="size-3" />
            Partially Verified ({verifiedAccepts}/{totalAccepts})
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Only some payment addresses are verified</p>
          <p className="text-muted-foreground">
            {verifiedAccepts} out of {totalAccepts} payment addresses have verified
            ownership proofs.
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Unverified state
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <ShieldAlert
            className={cn('size-4 text-muted-foreground', className)}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Unverified</p>
          <p className="text-muted-foreground">
            No verified ownership proofs
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary border border-border rounded-full px-2 py-0.5 cursor-help',
            className
          )}
        >
          <ShieldAlert className="size-3" />
          Unverified
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">No verified ownership proofs</p>
        <p className="text-muted-foreground">
          Add ownership proofs to your discovery document to verify control of
          payment addresses.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
