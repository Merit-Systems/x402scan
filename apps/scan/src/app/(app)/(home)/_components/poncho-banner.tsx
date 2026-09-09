'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { ArrowUpRight, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'x402scan-hide-poncho-banner';

export const PonchoBanner = () => {
  const isDismissed = useSyncExternalStore(
    subscribeToDismissedState,
    getDismissedSnapshot,
    getServerDismissedSnapshot
  );

  if (isDismissed) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-2 pb-8 pt-1 md:pb-10 md:pt-2">
      <section
        aria-labelledby="poncho-banner-title"
        className="relative overflow-hidden rounded-lg border border-[#3a3b36] bg-[#262723] px-4 py-3 pr-11 shadow-xs md:px-5 md:py-3.5 md:pr-12"
      >
        <button
          type="button"
          aria-label="Dismiss Poncho banner"
          className="absolute right-3 top-3 inline-flex size-6 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, 'true');
            window.dispatchEvent(new Event(STORAGE_KEY));
          }}
        >
          <X className="size-4" />
        </button>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center md:size-14">
              <Image
                src="/poncho-logo-dark.svg"
                alt=""
                width={56}
                height={58}
                className="size-10 object-contain md:size-12"
                priority
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <h2
                id="poncho-banner-title"
                className="font-mono text-lg font-bold leading-tight text-white md:text-xl"
              >
                Poncho
              </h2>
              <p className="max-w-2xl text-sm leading-5 text-white/70 md:text-base">
                Poncho is the easiest way to call every API listed on x402scan
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="h-10 w-full rounded-full bg-[#e8e8e1] px-5 text-[#262723] shadow-none hover:bg-[#f2f2ec] md:w-auto"
          >
            <Link
              href="https://tripuncho.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Try Poncho
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

function subscribeToDismissedState(onStoreChange: () => void) {
  window.addEventListener(STORAGE_KEY, onStoreChange);
  window.addEventListener('storage', onStoreChange);

  return () => {
    window.removeEventListener(STORAGE_KEY, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

function getDismissedSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function getServerDismissedSnapshot() {
  return false;
}
