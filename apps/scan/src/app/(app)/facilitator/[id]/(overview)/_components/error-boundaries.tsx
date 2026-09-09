"use client";

import { ErrorBoundary } from "react-error-boundary";

import type { ReactNode } from "react";

interface FacilitatorUsageErrorBoundaryProps {
  children: ReactNode;
}

export function FacilitatorUsageErrorBoundary({
  children,
}: FacilitatorUsageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <p className="type-supporting-body text-muted-foreground">
          Usage data is temporarily unavailable.
        </p>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

interface FacilitatorServersErrorBoundaryProps {
  children: ReactNode;
}

export function FacilitatorServersErrorBoundary({
  children,
}: FacilitatorServersErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <p className="type-supporting-body text-muted-foreground">
          Servers are temporarily unavailable.
        </p>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
