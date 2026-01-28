import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { Book, BookBinding, BookCover } from './book';

import { cn } from '@/lib/utils';

export const GuideBanner = () => {
  return (
    <Card className="flex items-center gap-4 p-6 justify-between">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Getting Started Guide</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          An interactive guide to help you build knowledge work automations.
        </p>
        <Link href="/mcp/guide/knowledge-work" className="w-fit">
          <Button size="xl" className="w-fit">
            Start
          </Button>
        </Link>
      </div>
      <Book className="h-45.25 w-40">
        <BookBinding className="w-4" />
        <BookCover
          className={cn(
            'relative from-neutral-100 to-neutral-200',
            'dark:from-neutral-100 dark:to-neutral-200',
            'flex flex-col justify-between p-2'
          )}
        >
          <svg
            fill="none"
            height="100%"
            viewBox="122 0 16 24"
            width="100%"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute -top-px right-4 w-4 h-6 text-primary"
          >
            <path
              d="M122 1C122 0.447716 122.448 0 123 0H137C137.552 0 138 0.447715 138 1V22.259C138 23.0308 137.163 23.5116 136.496 23.1227L130.504 19.6273C130.193 19.4456 129.807 19.4456 129.496 19.6273L123.504 23.1227C122.837 23.5116 122 23.0308 122 22.259V1Z"
              fill="currentColor"
            ></path>
          </svg>
          <h2 className="text-lg font-bold dark:text-neutral-800">
            Build <br /> Enrichment <br /> Workflows
          </h2>
        </BookCover>
      </Book>
    </Card>
  );
};
