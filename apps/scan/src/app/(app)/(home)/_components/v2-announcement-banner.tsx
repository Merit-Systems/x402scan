'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X, Zap, BookOpen, Layers } from 'lucide-react';
import Link from 'next/link';

const STORAGE_KEY = 'x402scan-hide-v2-announcement';

export const V2AnnouncementBanner = () => {
  const [isDismissed, setIsDismissed] = useState(true); // Default to true to avoid flash

  useEffect(() => {
    // Check localStorage on mount (only runs on client)
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="border border-primary bg-primary/5 p-4 rounded-md flex flex-col md:flex-row md:items-center gap-4 md:justify-between relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-primary/60 hover:text-primary z-10"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-center gap-4 pr-6 md:pr-0">
        <Sparkles className="size-8 text-primary shrink-0" />
        <div className="flex flex-col">
          <h2 className="font-mono text-base md:text-lg font-bold text-primary">
            Introducing x402scan v2
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            A major update with native v2 support, faster performance, and a new
            discovery standard.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm md:mr-6 shrink-0">
        <div className="flex items-start gap-2">
          <Layers className="size-4 text-primary shrink-0 mt-0.5" />
          <span className="text-muted-foreground">
            Native support for x402 v2 resources and facilitators
          </span>
        </div>
        <div className="flex items-start gap-2">
          <BookOpen className="size-4 text-primary shrink-0 mt-0.5" />
          <span className="text-muted-foreground">
            New x402scan Discovery Standard —{' '}
            <Link
              href="https://github.com/Merit-Systems/x402scan/blob/main/docs/DISCOVERY.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              learn more
            </Link>
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Zap className="size-4 text-primary shrink-0 mt-0.5" />
          <span className="text-muted-foreground">
            x402scan stability and performance improvements
          </span>
        </div>
      </div>
    </div>
  );
};
