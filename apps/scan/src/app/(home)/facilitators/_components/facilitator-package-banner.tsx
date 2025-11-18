'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Package, X } from 'lucide-react';
import Link from 'next/link';

const STORAGE_KEY = 'x402scan-hide-facilitator-package-banner';

export const FacilitatorPackageBanner = () => {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
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
        <Package className="size-8 text-primary" />
        <div className="flex flex-col gap-1">
          <h2 className="font-mono text-base md:text-lg font-bold text-primary">
            New: Facilitator Router
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Use the auto facilitator to load-balance between facilitators for
            guaranteed uptime. Replace your facilitator URL with:{' '}
            <code>facilitators.x402scan.com</code> to get started.
          </p>
        </div>
      </div>
      <Link
        href="https://www.npmjs.com/package/facilitators"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 w-full md:w-fit md:mr-4"
      >
        <Button variant="outline" className="w-full px-4">
          View Package
        </Button>
      </Link>
    </div>
  );
};
