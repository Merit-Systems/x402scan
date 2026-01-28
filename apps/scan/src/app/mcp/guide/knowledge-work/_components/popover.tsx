'use client';

import { Button } from '@/components/ui/button';
import { SectionBook } from '../../_components/header/book';
import type { Guide } from '../../_lib/mdx';
import { Separator } from '@/components/ui/separator';
import { usePageLocation } from '../../_hooks/use-page-location';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Route } from 'next';

export const KnowledgeWorkPopover: React.FC<{ guide: Guide }> = ({ guide }) => {
  const pageLocation = usePageLocation(guide);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 p-2">
        {guide.items
          .filter(item => item.type === 'section')
          .map(section => (
            <Link
              href={
                `/mcp/guide/knowledge-work/${section.slug}/${section.items[0]!.slug}` as Route
              }
              key={section.slug}
              className="w-full cursor-pointer"
            >
              <Button
                key={section.slug}
                variant="ghost"
                className={cn(
                  'flex items-center h-fit md:h-fit p-2 justify-start gap-4 w-full',
                  pageLocation?.section?.slug === section.slug && 'bg-accent'
                )}
              >
                <SectionBook
                  icon={section.icon}
                  selected={pageLocation?.section?.slug === section.slug}
                />
                <div className="flex flex-col items-start text-left">
                  <h3 className="text-sm font-medium">{section.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {section.items.length} Modules
                  </p>
                </div>
              </Button>
            </Link>
          ))}
      </div>
      <Separator />
      <div className="p-2 flex flex-col">
        {pageLocation?.section?.items
          .filter(item => item.type === 'page')
          .map(item => (
            <Link
              href={
                `/mcp/guide/knowledge-work/${pageLocation?.section?.slug}/${item.slug}` as Route
              }
              key={item.slug}
              className="w-full cursor-pointer"
            >
              <Button variant="ghost" className="w-full">
                <p className="text-sm font-medium">{item.slug}</p>
              </Button>
            </Link>
          ))}
      </div>
    </div>
  );
};
