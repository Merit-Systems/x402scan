'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TestTube, X } from 'lucide-react';
import Link from 'next/link';

const STORAGE_KEY = 'x402scan-hide-developer-tool-banner';

export const DeveloperToolBanner = () => {
  const [isDismissed, setIsDismissed] = useState(true); // Default to true to avoid flash

  useEffect(() => {
    // Check localStorage on mount
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
    <div className="border border-primary bg-primary/5 p-4 rounded-md flex flex-col md:flex-row items-center gap-2 justify-between relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-primary/60 hover:text-primary z-10"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-center gap-4 pr-6 md:pr-0">
        <TestTube className="size-8 text-primary" />
        <div className="flex flex-col">
          <h2 className="font-mono text-base md:text-lg font-bold text-primary">
            New: Developer Tools
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Preview and validate your x402 endpoint while you&apos;re
            developing.
          </p>
        </div>
      </div>
      <Link href="/developer" className="shrink-0 w-full md:w-fit md:mr-4">
        <Button variant="outline" className="w-full px-4">
          Try Now
        </Button>
      </Link>
    </div>
  );
};
