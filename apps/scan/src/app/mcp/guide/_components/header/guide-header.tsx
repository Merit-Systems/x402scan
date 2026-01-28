import Image from 'next/image';

import { List } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover as PopoverComponent,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { CurrentPage, Book, ScrollToTopButton } from './client';

import type { Guide } from '../../_lib/mdx';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

interface Props {
  guide: Guide;
  Popover: React.FC<{ guide: Guide }>;
}

export const GuidesHeader: React.FC<Props> = ({ guide, Popover }) => {
  return (
    <div className="flex items-center justify-between bg-background border rounded-full p-3">
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
        <PopoverContent
          className="p-0 w-96 shadow-none rounded-xl bg-card"
          sideOffset={24}
          align="start"
          alignOffset={-8}
        >
          <Link href="/mcp/guide/knowledge-work">
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
          <Popover guide={guide} />
        </PopoverContent>
      </PopoverComponent>

      <div className="w-px h-6 bg-border ml-2 mr-4" />

      <div className="flex items-center gap-3 justify-between flex-1">
        <div className="flex items-center gap-3">
          <Book guide={guide} />
          <CurrentPage guide={guide} />
        </div>
      </div>
      <div className="w-px h-6 bg-border ml-4 mr-2" />

      <ScrollToTopButton />
    </div>
  );
};
