'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';

import { Section } from '@/app/_components/layout/page-utils';

import { JustAddedCard, LoadingJustAddedCard } from './card';

import { api } from '@/trpc/client';

import { cn } from '@/lib/utils';

const CARD_CLASSES = cn(
  'flex-[0_0_70%]',
  'sm:flex-[0_0_38%]',
  'md:flex-[0_0_28%]',
  'lg:flex-[0_0_22%]',
  'min-w-0'
);

const SectionTitle = () => (
  <div className="flex flex-col gap-1">
    <h1 className="font-bold text-xl md:text-2xl">Just Added</h1>
    <div className="flex items-center gap-1.5 text-muted-foreground text-sm md:text-base">
      <span>Newest services on</span>
      <Logo className="size-4" />
      <span className="font-bold font-mono text-foreground">x402scan</span>
    </div>
  </div>
);

export const JustAddedCarousel = () => {
  const [origins] = api.public.origins.recent.useSuspenseQuery({
    limit: 15,
  });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: 'start',
      slidesToScroll: 1,
      dragFree: true,
      containScroll: 'trimSnaps',
      dragThreshold: 10,
      watchDrag: true,
    },
    [WheelGesturesPlugin()]
  );

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  if (origins.length === 0) return null;

  return (
    <Section
      title={<SectionTitle />}
      actions={
        <Link href="/resources/register" className="self-start">
          <Button size="sm" className="h-9">
            <Plus className="size-4" />
            Add your API
          </Button>
        </Link>
      }
    >
      <div className="overflow-hidden -mt-4" ref={emblaRef}>
        <div className="flex gap-2 pt-4 pb-2 pl-px">
          {origins.map(origin => (
            <div key={origin.id} className={CARD_CLASSES}>
              <JustAddedCard origin={origin} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 -mt-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className={cn(
            'size-fit md:size-fit p-1',
            !canScrollPrev && 'invisible'
          )}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollNext}
          disabled={!canScrollNext}
          className="size-fit md:size-fit p-1"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </Section>
  );
};

export const LoadingJustAddedCarousel = () => {
  return (
    <Section
      title={<SectionTitle />}
    >
      <div className="overflow-hidden">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={CARD_CLASSES}>
              <LoadingJustAddedCard />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};
