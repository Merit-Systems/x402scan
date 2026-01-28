'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ArrowUp, List } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover as PopoverComponent,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

import { SectionBook } from './book';

import { usePageLocation } from '@/app/mcp/guide/_hooks/use-page-location';

import type { Guide } from '../../../_lib/mdx';
import type { Route } from 'next';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface Props {
  guide: Guide;
  Popover: React.FC<{ guide: Guide; onClose: () => void }>;
}

export const GuidesHeader: React.FC<Props> = ({ guide, Popover }) => {
  const location = usePageLocation(guide);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const currentTitle = location?.page?.title ?? guide.title;
  const subtitle = location?.section?.title ?? guide.description;

  return (
    <div className="flex items-center justify-between bg-background border rounded-full px-3 py-2 md:py-3 sticky top-6 z-50">
      <div className="hidden md:block">
        <PopoverComponent open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
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
            <Popover guide={guide} onClose={() => setIsPopoverOpen(false)} />
          </PopoverContent>
        </PopoverComponent>
      </div>
      <div className="block md:hidden">
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full size-6 md:size-6"
            >
              <List className="size-3" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="items-start text-left">
              <DrawerTitle>{guide.title}</DrawerTitle>
              <DrawerDescription className="text-left">
                {guide.description}
              </DrawerDescription>
            </DrawerHeader>
            <Separator />
            <Popover guide={guide} onClose={() => setIsDrawerOpen(false)} />
          </DrawerContent>
        </Drawer>
      </div>

      <div className="w-px h-6 bg-border ml-2 mr-4" />

      <div className="flex items-center gap-3 justify-between flex-1">
        <div className="flex items-center gap-3">
          <SectionBook
            icon={location?.section?.icon}
            className="hidden md:flex"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{currentTitle}</span>
            {subtitle && (
              <span className="text-muted-foreground text-xs">{subtitle}</span>
            )}
          </div>
        </div>
      </div>
      <div className="w-px h-6 bg-border ml-4 mr-2" />

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full size-6 md:size-8"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp className="size-3 md:size-4" />
      </Button>
    </div>
  );
};
