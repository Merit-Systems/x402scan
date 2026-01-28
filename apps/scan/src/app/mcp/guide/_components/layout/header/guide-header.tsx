'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { List } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover as PopoverComponent,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

import { CurrentPage, Book, ScrollToTopButton } from './client';

import type { Guide } from '../../../_lib/mdx';
import type { Route } from 'next';

interface Props {
  guide: Guide;
  Popover: React.FC<{ guide: Guide; onClose: () => void }>;
}

export const GuidesHeader: React.FC<Props> = ({ guide, Popover }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center justify-between bg-background border rounded-full px-3 py-2 md:py-3 sticky top-6 z-50">
      <PopoverComponent open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full size-8 md:size-8"
          >
            <List className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-96 shadow-none rounded-xl bg-card"
          sideOffset={24}
          align="start"
          alignOffset={-8}
        >
          <Link href={'/mcp/guide/knowledge-work' as Route} className="w-fit">
            <div className="p-4 flex items-center gap-3">
              {guide.icon && (
                <Image
                  src={guide.icon}
                  alt={guide.title}
                  width={20}
                  height={20}
                  className="size-4"
                />
              )}
              <div className="flex flex-col">
                <p className="text-sm font-semibold">{guide.title}</p>
                <p className="text-xs text-muted-foreground">
                  {guide.description}
                </p>
              </div>
            </div>
          </Link>
          <Separator />
          <Popover guide={guide} onClose={() => setIsOpen(false)} />
        </PopoverContent>
      </PopoverComponent>

      <div className="w-px h-6 bg-border ml-2 mr-4" />

      <div className="flex items-center gap-3 justify-between flex-1">
        <div className="flex items-center gap-3">
          <Book guide={guide} className="hidden md:flex" />
          <CurrentPage guide={guide} />
        </div>
      </div>
      <div className="w-px h-6 bg-border ml-4 mr-2" />

      <ScrollToTopButton />
    </div>
  );
};
