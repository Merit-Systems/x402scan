import { ArrowUp, List } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover as PopoverComponent,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { Logo } from '@/components/logo';

import {
  Book,
  BookBinding,
  BookContent,
  BookCover,
} from '@/app/mcp/_components/guide/book';

import { CurrentPage, Icon, ScrollToTopButton } from './client';

import type { Guide } from '../../_lib/mdx';

interface Props {
  guide: Guide;
  Popover: React.FC<{ guide: Guide }>;
}

export const GuidesHeader: React.FC<Props> = ({ guide, Popover }) => {
  console.log(guide);
  return (
    <div className="flex items-center justify-between bg-card border rounded-full p-3">
      {/* Left side: List icon + Task info */}
      <PopoverComponent>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full size-8 md:size-8"
          >
            <List className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Popover guide={guide} />
        </PopoverContent>
      </PopoverComponent>

      <div className="w-px h-6 bg-border ml-2 mr-4" />

      <div className="flex items-center gap-3 justify-between flex-1">
        <div className="flex items-center gap-3">
          <Book className="h-10 w-8 rounded-sm">
            <BookBinding className="w-1.25" />
            <BookCover className="flex flex-col justify-between">
              <BookContent>
                <div className="p-1 bg-white/50 dark:bg-black/50 rounded-full [box-shadow:0_0.5_rgba(0,0,0,0.15)] dark:[box-shadow:0_0.5_rgba(255,255,255,0.15)]">
                  <Icon guide={guide} className="size-2.5" />
                </div>
              </BookContent>
            </BookCover>
          </Book>
          <CurrentPage guide={guide} />
        </div>
      </div>
      <div className="w-px h-6 bg-border ml-4 mr-2" />

      <ScrollToTopButton />
    </div>
  );
};
