'use client';

import { Info } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

import { useSpeculativeFilter } from './speculative-filter';

export const SpeculativeFilterDescription = () => {
  const { showGamed, setShowSpeculative } = useSpeculativeFilter();

  return (
    <span className="inline-flex items-center gap-1">
      Top addresses that have received x402 transfers and are listed in the
      Bazaar
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              The Merit team curates this list to show what we believe is
              non-gamed, non-speculative traffic.
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={showGamed}
                onCheckedChange={checked => setShowSpeculative(checked === true)}
              />
              <span className="text-sm">Show all servers</span>
            </label>
          </div>
        </PopoverContent>
      </Popover>
    </span>
  );
};
