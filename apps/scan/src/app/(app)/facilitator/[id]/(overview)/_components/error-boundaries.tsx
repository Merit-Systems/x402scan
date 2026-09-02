"use client";

import { ErrorBoundary } from "react-error-boundary";

import { UsageSection } from "@/components/usage-section";

import type { ReactNode } from "react";

export function FacilitatorUsageErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={
        <UsageSection>
          <p className="type-supporting-body text-muted-foreground">
            Usage data is temporarily unavailable.
          </p>
        </UsageSection>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function FacilitatorServersErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
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
