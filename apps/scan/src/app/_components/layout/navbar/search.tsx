'use client';

import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Shortcut } from '@/components/ui/shortcut';

import { useSearch } from '@/app/_contexts/search/hook';

export const NavbarSearchButton = () => {
  const { setIsOpen } = useSearch();

  return (
    <Button
      size="navbar"
      variant="outline"
      className="flex md:justify-between items-center gap-0 md:gap-16 text-muted-foreground md:px-2 md:pr-1"
      onClick={() => setIsOpen(true)}
    >
      <div className="flex items-center gap-0 md:gap-2 text-sm">
        <Search className="size-4" />
        <span className="hidden md:block">Search</span>
      </div>
      <Shortcut className="hidden md:block px-1 bg-muted rounded-md">
        ⌘K
      </Shortcut>
    </Button>
  );
};
