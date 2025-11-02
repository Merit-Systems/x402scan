import { useRef } from 'react';

import Image from 'next/image';

import { Bot, MessagesSquare, Server, User } from 'lucide-react';

import { AnimatedBeam, Circle } from '@/components/magicui/animated-beam';

import { cn } from '@/lib/utils';

export const FundStep = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const usdcRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const server1Ref = useRef<HTMLDivElement>(null);
  const server2Ref = useRef<HTMLDivElement>(null);

  const circleClassName = 'p-2 md:p-3 bg-card';
  const iconClassName = 'size-4 md:size-6';

  return (
    <div
      className="relative w-full max-w-full overflow-hidden h-full flex flex-col justify-center"
      ref={containerRef}
    >
      <div className="flex items-center justify-between gap-4">
        <Circle ref={userRef} className={circleClassName}>
          <User className={iconClassName} />
        </Circle>
        <Circle ref={usdcRef} className={cn(circleClassName, 'p-0 md:p-0')}>
          <Image
            src="/usdc.png"
            alt="USDC"
            width={60}
            height={60}
            className={cn(iconClassName, 'size-8 md:size-12')}
          />
        </Circle>
        <Circle ref={composerRef} className={circleClassName}>
          <Bot className={iconClassName} />
        </Circle>
        <div className="flex flex-col gap-2">
          <Circle ref={server1Ref} className={circleClassName}>
            <MessagesSquare className={iconClassName} />
          </Circle>
          <Circle ref={server2Ref} className={circleClassName}>
            <Server className={iconClassName} />
          </Circle>
        </div>
      </div>
      <AnimatedBeam
        fromRef={userRef}
        toRef={usdcRef}
        containerRef={containerRef}
        {...beamProps}
      />
      <AnimatedBeam
        fromRef={usdcRef}
        toRef={composerRef}
        containerRef={containerRef}
        {...beamProps}
      />
      <AnimatedBeam
        fromRef={server1Ref}
        toRef={composerRef}
        containerRef={containerRef}
        {...beamProps}
      />
      <AnimatedBeam
        fromRef={server2Ref}
        toRef={composerRef}
        containerRef={containerRef}
        {...beamProps}
      />
    </div>
  );
};

const beamProps = {
  delay: 0,
  duration: 2,
  endXOffset: 0,
  endYOffset: 0,
  startXOffset: 0,
  startYOffset: 0,
  pathWidth: 2,
};
