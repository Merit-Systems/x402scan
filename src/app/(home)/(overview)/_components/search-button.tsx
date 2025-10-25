'use client';

import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Shortcut } from '@/components/ui/shortcut';

import { useSearch } from '@/app/_contexts/search/hook';
import { cn } from '@/lib/utils';

export const SearchButton = () => {
  const { setIsOpen } = useSearch();

  return <SearchButtonContent onClick={() => setIsOpen(true)} />;
};

const SearchButtonContent = ({ onClick }: { onClick?: () => void }) => {
  return (
    <Button
      size="lg"
      variant="outline"
      className={cn(
        'flex justify-start md:justify-between items-center gap-0 md:gap-16 text-muted-foreground/80 px-2 md:px-2 md:pr-1 w-full md:w-auto md:flex-1 font-normal hover:text-muted-foreground/80 group bg-transparent'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-1 md:gap-2 text-sm">
        <Search className="size-4" />
        <span className="text-xs md:text-sm">
          Search servers, resources, addresses, and more...
        </span>
      </div>
      <Shortcut className="hidden md:block px-1 bg-muted rounded-md group-hover:bg-transparent transition-colors duration-200">
        ⌘K
      </Shortcut>
    </Button>
  );
};
