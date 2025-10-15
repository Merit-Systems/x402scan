'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, type RouterOutputs } from '@/trpc/client';
import { SearchResultsTable } from '@/app/_components/resources/display/search-results-table';

interface ResourceSearchBarProps {
  popularOrigins?: RouterOutputs['origins']['list']['aggregated']['items'];
}

export const ResourceSearchBar: React.FC<ResourceSearchBarProps> = ({
  popularOrigins = [],
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startY, setStartY] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading } =
    api.origins.searchAdvanced.useQuery(
      {
        search: searchTerm,
        limit: 20,
      },
      {
        enabled: searchTerm.length > 0 && isFocused,
      }
    );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocused) {
        setIsFocused(false);
        setSearchTerm('');
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFocused]);

  useEffect(() => {
    if (isFocused) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isFocused]);

  const handleClose = () => {
    setIsFocused(false);
    setSearchTerm('');
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setStartY(rect.top);
    }
    setIsFocused(true);
  };

  return (
    <>
      {/* Backdrop blur */}
      {isFocused && (
        <div
          className="fixed inset-0 bg-background/50 backdrop-blur-md z-40 transition-all duration-300 ease-in-out"
          onClick={handleClose}
        />
      )}

      {/* Search bar container */}
      <div
        ref={containerRef}
        className={cn(
          isFocused
            ? 'fixed top-8 left-1/2 -translate-x-1/2 w-[80vw] z-50'
            : 'relative w-full'
        )}
        style={
          isFocused && startY > 0
            ? ({
                animationName: 'slide-up-from-origin',
                animationDuration: '0.5s',
                animationTimingFunction: 'ease-in-out',
                '--start-y': `${startY - 32}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <div className="relative">
          <Search
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-300',
              isFocused ? 'size-5' : 'size-4'
            )}
          />
          <Input
            ref={inputRef}
            placeholder="Search resources, origins, and more..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={handleFocus}
            className={cn(
              'transition-all duration-500 ease-in-out',
              isFocused
                ? 'h-14 text-lg pl-12 pr-12 shadow-2xl border-2'
                : 'h-12 pl-10 pr-4'
            )}
          />
          {isFocused && searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* Search results */}
        {isFocused && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <SearchResultsTable
              origins={searchTerm ? (searchResults ?? []) : popularOrigins}
              isLoading={isLoading && searchTerm.length > 0}
              searchTerm={searchTerm}
              onClose={handleClose}
              showPopular={!searchTerm}
            />
          </div>
        )}
      </div>
    </>
  );
};
