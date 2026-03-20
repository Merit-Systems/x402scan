'use client';

import { Info } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

import { useGamedFilter } from './gamed-filter';

export const GamedFilterPopover = () => {
  const { showGamed, setShowGamed } = useGamedFilter();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Info className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            The Merit team curates this list to show what we believe is
            non-gamed traffic.
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={showGamed}
              onCheckedChange={checked => setShowGamed(checked === true)}
            />
            <span className="text-sm">Show all servers</span>
          </label>
        </div>
      </PopoverContent>
    </Popover>
  );
};
