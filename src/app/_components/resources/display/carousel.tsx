'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CarouselProps {
  children: React.ReactNode[];
  className?: string;
  autoplay?: boolean;
  compact?: boolean;
}

export const Carousel: React.FC<CarouselProps> = ({
  children,
  className,
  autoplay = true,
  compact = false,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      skipSnaps: false,
      dragFree: true,
    },
    autoplay ? [Autoplay({ delay: 4000, stopOnInteraction: false })] : []
  );

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className={cn('relative', className)}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {children.map((child, index) => (
            <div
              key={index}
              className={cn(
                'pl-4 first:pl-0',
                compact
                  ? 'flex-[0_0_100%] md:flex-[0_0_33%] lg:flex-[0_0_25%]'
                  : 'flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33%]'
              )}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {children.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 size-8"
            onClick={scrollPrev}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 size-8"
            onClick={scrollNext}
          >
            <ChevronRight className="size-4" />
          </Button>
        </>
      )}
    </div>
  );
};
