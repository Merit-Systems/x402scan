"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "x402scan-hide-agentcash-announcement";

export const AgentCashAnnouncementBanner = () => {
  const [isDismissed, setIsDismissed] = useState(true); // Default to true to avoid flash

  useEffect(() => {
    // Check localStorage on mount (effects only run in the browser)
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === "true");
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.setItem(STORAGE_KEY, "true");
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="relative flex flex-col gap-4 rounded-md border border-primary/40 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4 pr-6 md:pr-0">
        <Image
          src="/agentcash-light.svg"
          alt="AgentCash"
          width={32}
          height={32}
          className="block shrink-0 dark:hidden"
        />
        <Image
          src="/agentcash-dark.svg"
          alt="AgentCash"
          width={32}
          height={32}
          className="hidden shrink-0 dark:block"
        />
        <div className="flex flex-col">
          <h2 className="text-base font-bold text-primary md:text-lg">
            Introducing AgentCash
          </h2>
          <p className="text-xs text-muted-foreground md:text-sm">
            The x402 wallet for your AI agent. One balance for any x402 API. We
            are giving away $100k in sign up bonuses.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" asChild>
          <Link
            href="https://agentcash.dev/onboard"
            target="_blank"
            rel="noopener noreferrer"
          >
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
