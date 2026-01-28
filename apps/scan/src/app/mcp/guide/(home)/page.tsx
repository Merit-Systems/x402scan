import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { Logo } from '@/components/logo';

import { Book, BookBinding, BookCover } from '@/app/mcp/guide/_components/book';

import { cn } from '@/lib/utils';

export default function GuidePage() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-16">
      <div className="flex flex-col gap-2 items-center text-center">
        <h1 className="text-4xl font-bold">Automate Your Knowledge Work</h1>
        <p className="text-muted-foreground max-w-sm text-lg">
          Use Claude Code and x402 to build Research, Go-to-Market, and Sales
          workflows.
        </p>
      </div>
      <Card className="mt-12 flex flex-col items-center gap-4 pb-4">
        <Book className="-mt-12 h-45.25 w-40">
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
            <div className="flex justify-end">
              <div className="p-2 rounded-full bg-background shadow-none">
                <Logo />
              </div>
            </div>
          </BookCover>
        </Book>
        <div className="flex flex-col gap-4 items-center">
          <p className="max-w-xs text-center font-medium">
            Interactive Prompt Guides for Building Knowledge Work Automations.
          </p>
          <Button size="lg" className="w-fit">
            View Guides
          </Button>
        </div>
      </Card>
    </div>
  );
}
