import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { Book, BookBinding, BookContent, BookCover } from './book';

import type { Route } from 'next';

interface Props {
  title: string;
  description: string;
  Icon: ({ className }: { className: string }) => React.ReactNode;
  href: Route;
}

export const GuideCard: React.FC<Props> = ({
  title,
  description,
  Icon,
  href,
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Book className="h-15 w-13">
          <BookBinding />
          <BookCover>
            <BookContent className="px-2">
              <div className="p-1.5 bg-white/80 dark:bg-black/50 rounded-full [box-shadow:0_1px_rgba(0,0,0,0.15)] dark:[box-shadow:0_0.5_rgba(255,255,255,0.15)]">
                <Icon className="size-4 text-neutral-500 dark:text-neutral-400" />
              </div>
            </BookContent>
          </BookCover>
        </Book>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>

        <Link href={href}>
          <Button variant="outline" className="w-full" size="sm">
            Start
            <ArrowRight className="size-4 transition-all shrink-0" />
          </Button>
        </Link>
      </div>
    </Card>
  );
};
