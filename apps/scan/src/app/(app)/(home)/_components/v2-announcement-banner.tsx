'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'x402scan-hide-agentcash-announcement';

export const AgentCashAnnouncementBanner = () => {
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
    <div className="border border-primary/40 bg-primary/5 p-4 rounded-md flex flex-col md:flex-row md:items-center gap-4 md:justify-between relative">
      <div className="flex items-center gap-4 pr-6 md:pr-0">
        <Image src="/agentcash-light.svg" alt="AgentCash" width={32} height={32} className="shrink-0 block dark:hidden" />
        <Image src="/agentcash-dark.svg" alt="AgentCash" width={32} height={32} className="shrink-0 hidden dark:block" />
        <div className="flex flex-col">
          <h2 className="text-base md:text-lg font-bold text-primary">
            Introducing AgentCash
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            The x402 wallet for your AI agent. One balance. Every paid API on the
            internet. $100k sign up bonuses available.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" asChild>
          <Link href="https://agentcash.dev/onboard" target="_blank" rel="noopener noreferrer">
            Try AgentCash
          </Link>
        </Button>
        <Button size="sm" variant="outline" onClick={handleDismiss}>
          Close
        </Button>
      </div>
    </div>
  );
};
