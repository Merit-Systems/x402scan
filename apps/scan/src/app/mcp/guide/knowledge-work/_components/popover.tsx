'use client';

import { Button } from '@/components/ui/button';
import { SectionBook } from '../../_components/header/book';
import type { Guide } from '../../_lib/mdx';
import { Separator } from '@/components/ui/separator';
import { usePageLocation } from '../../_hooks/use-page-location';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Route } from 'next';
import { useState } from 'react';

export const KnowledgeWorkPopover: React.FC<{ guide: Guide }> = ({ guide }) => {
  const pageLocation = usePageLocation(guide);

  const [selectedSection, setSelectedSection] = useState<string | undefined>(
    pageLocation?.section?.slug
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 p-2">
        {guide.items
          .filter(item => item.type === 'section')
          .map(section => (
            <Button
              key={section.slug}
              variant="ghost"
              className={cn(
                'flex items-center h-fit md:h-fit p-2 justify-start gap-4 w-full',
                selectedSection === section.slug && 'bg-accent'
              )}
              onClick={() => setSelectedSection(section.slug)}
            >
              <SectionBook
                icon={section.icon}
                selected={selectedSection === section.slug}
              />
              <div className="flex flex-col items-start text-left">
                <h3 className="text-sm font-medium">{section.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {section.items.length} Modules
                </p>
              </div>
            </Button>
          ))}
      </div>
      <Separator />
      <div className="p-2 flex flex-col gap-3 py-4">
        {selectedSection &&
          guide.items
            .filter(item => item.type === 'section')
            .find(item => item.slug === selectedSection)
            ?.items.filter(item => item.type === 'page')
            .map((item, index) => (
              <Link
                href={
                  `/mcp/guide/knowledge-work/${selectedSection}/${item.slug}` as Route
                }
                key={item.slug}
                className="w-full cursor-pointer group"
              >
                <div className="w-full justify-start h-fit md:h-fit gap-3 flex items-center px-3">
                  <div
                    className={cn(
                      'size-6 text-sm rounded-full flex items-center justify-center bg-primary/20 text-primary',
                      'group-hover:bg-primary/40 transition-all',
                      pageLocation?.page?.slug === item.slug &&
                        'bg-primary text-white'
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <p className="text-sm font-normal">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
};
