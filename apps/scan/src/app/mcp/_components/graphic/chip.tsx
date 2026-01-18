'use client';

import { useRef } from 'react';

import { Logo } from '@/components/logo';
import { AnimatedBeam } from '@/components/magicui/animated-beam';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
}

export const Chip: React.FC<Props> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const bottomChipRef = useRef<HTMLDivElement>(null);
  const topChipRef = useRef<HTMLDivElement>(null);

  // Refs for circle endpoints (top)
  const topCircle1Ref = useRef<HTMLDivElement>(null);
  const topCircle2Ref = useRef<HTMLDivElement>(null);

  // Refs for circle endpoints (bottom)
  const bottomCircle1Ref = useRef<HTMLDivElement>(null);
  const bottomCircle2Ref = useRef<HTMLDivElement>(null);

  const beamProps = {
    duration: 2,
    delay: 0,
    isVertical: true,
    pathWidth: 2,
    beamWidth: 0,
    pathOpacity: 0.1,
  };

  const circleClassName =
    'bg-background border-primary/20 border-2 size-2 rounded-full z-10';

  return (
    <div ref={containerRef} className="relative flex flex-col gap-8 h-full">
      <div className="flex flex-col gap-4">
        <div className={circleClassName} ref={topCircle1Ref} />
        <div className={cn(circleClassName, 'ml-auto')} ref={topCircle2Ref} />
      </div>
      <Card className="size-24 flex flex-col items-center justify-center border-primary/40 border-2 relative z-10 rounded-xl">
        <Logo className="size-12" />
        {/* Top edge anchor points */}
        <div ref={topChipRef} className="absolute top-0 w-full" />
        <div ref={bottomChipRef} className="absolute bottom-0 w-full" />
      </Card>
      <div className="flex flex-col gap-4">
        <div className={circleClassName} ref={bottomCircle1Ref} />
        <div
          className={cn(circleClassName, 'ml-auto')}
          ref={bottomCircle2Ref}
        />
      </div>

      {/* Top circles */}

      {/* Animated beams from top edge to top circles */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={topChipRef}
        toRef={topCircle1Ref}
        startXOffset={-20}
        {...beamProps}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={topChipRef}
        toRef={topCircle2Ref}
        startXOffset={20}
        {...beamProps}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={bottomChipRef}
        toRef={bottomCircle1Ref}
        startXOffset={-20}
        {...beamProps}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={bottomChipRef}
        toRef={bottomCircle2Ref}
        startXOffset={20}
        {...beamProps}
      />

      {children}
    </div>
  );
};
