'use client';

import { ArrowUp } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { SectionBook } from './book';

import { usePageLocation } from '../../../_hooks/use-page-location';

import type { Guide } from '../../../_lib/mdx';

interface Props {
  guide: Guide;
}

export const CurrentPage: React.FC<Props> = ({ guide }) => {
  const pageLocation = usePageLocation(guide);

  const currentTitle = pageLocation?.page?.title ?? guide.title;
  const subtitle = pageLocation?.section?.title ?? guide.description;

  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium">{currentTitle}</span>
      {subtitle && (
        <span className="text-muted-foreground text-xs">{subtitle}</span>
      )}
    </div>
  );
};

export const ScrollToTopButton = () => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full size-8 md:size-8"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUp className="size-4" />
    </Button>
  );
};

export const Book: React.FC<Props & { className?: string }> = ({
  guide,
  className,
}) => {
  const location = usePageLocation(guide);

  return <SectionBook icon={location?.section?.icon} className={className} />;
};
