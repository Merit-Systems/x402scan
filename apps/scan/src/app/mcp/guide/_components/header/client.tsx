'use client';

import Image from 'next/image';

import { useParams } from 'next/navigation';
import { findPageLocation } from '../../_lib/navigation';

import type { Guide } from '../../_lib/mdx';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

interface Props {
  guide: Guide;
}

export const CurrentPage: React.FC<Props> = ({ guide }) => {
  const pageLocation = useLocation(guide);

  if (!pageLocation) {
    return null;
  }

  const currentTitle = pageLocation.section?.title ?? guide.title;
  const subtitle = pageLocation.section ? guide.title : null;

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

export const Icon: React.FC<Props & { className?: string }> = ({
  guide,
  className,
}) => {
  const location = useLocation(guide);

  if (location?.section?.icon) {
    return (
      <Image
        src={location.section.icon}
        alt={location.section.title}
        width={16}
        height={16}
        className={cn(className, 'dark:invert')}
      />
    );
  }

  return <Logo className={className} />;
};

const useLocation = (guide: Guide) => {
  const params = useParams<{ path: string[] }>();

  const path = params.path ?? [];
  const pageLocation = findPageLocation(guide.items, path);

  return pageLocation;
};
