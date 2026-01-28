import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { Logo } from '@/components/logo';

import { Book, BookBinding, BookCover } from './book';

import { cn } from '@/lib/utils';
import Link from 'next/link';

export const GuideBanner = () => {
  return (
    <Card className="flex items-center gap-4 p-6 justify-between">
      <div className="flex flex-col gap-4 items-center">
        <p className="max-w-xs text-left font-medium">
          Interactive Prompt Guides for Building Knowledge Work Automations
        </p>
        <Link href="/mcp/guide/knowledge-work">
          <Button size="xl" className="w-fit">
            Get Started
          </Button>
        </Link>
      </div>
    </Card>
  );
};
