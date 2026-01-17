'use client';

import { useEffect, useRef, useState } from 'react';

import { ChartCandlestick, ImageIcon, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';

import { AnimatedBeam } from '@/components/magicui/animated-beam';

import { cn } from '@/lib/utils';
import { Chip } from './chip';
import { ClientIcon } from './icons';
import { Clients } from '../clients/data';

export const HeroGraphic = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const client1Ref = useRef<HTMLDivElement>(null);
  const client2Ref = useRef<HTMLDivElement>(null);
  const client3Ref = useRef<HTMLDivElement>(null);

  const echoLeftRef = useRef<HTMLDivElement>(null);
  const echoRightRef = useRef<HTMLDivElement>(null);

  const server1Ref = useRef<HTMLDivElement>(null);
  const server2Ref = useRef<HTMLDivElement>(null);
  const server3Ref = useRef<HTMLDivElement>(null);

  const [activeClientIndex, setActiveClientIndex] = useState(0);
  const [activeServerIndices, setActiveServerIndices] = useState<number[]>([
    0, 2,
  ]);

  const cardProps = (isActive: boolean, side: 'left' | 'right') => ({
    className: cn(
      'flex flex-col items-center justify-center p-2 z-10 bg-card relative transition-all duration-500 border-2',
      isActive
        ? `border-primary/80 shadow-primary/60 shadow-[0_0_8px]`
        : 'opacity-50',
      isActive &&
        ((side === 'left' && !isReverse) ||
          (side === 'right' && isReverse && !isPending)) &&
        'animate-pulse-active'
    ),
  });
  const imageSize = 32;
  const imageProps = {
    width: imageSize,
    height: imageSize,
    className: 'transition-all duration-500',
  };
  const targetClassName = (isActive: boolean) =>
    cn(
      'absolute w-0 rounded-full size-1.5 bg-card border-2 z-10 transition-all duration-500',
      isActive ? 'border-primary/80' : 'border-border'
    );
  const targetLeftClassName = (isActive: boolean) =>
    cn(targetClassName(isActive), '-left-1');
  const targetRightClassName = (isActive: boolean) =>
    cn(targetClassName(isActive), '-right-1');

  const beamDuration = 3;

  const [isReverse, setIsReverse] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsReverse(prev => !prev);
      setIsPending(false);
    }, beamDuration * 1000);
    return () => clearInterval(interval);
  }, []);

  const updateActiveNodes = () => {
    setIsPending(true);
    setActiveClientIndex(prev => {
      // Pick randomly from the two non-active client indices
      const nonActive = [0, 1, 2].filter(i => i !== prev);
      return nonActive[Math.floor(Math.random() * nonActive.length)]!;
    });
    setActiveServerIndices(() => {
      const serverIndices = [0, 1, 2];
      const pickCount = Math.floor(Math.random() * 3) + 1; // pick 1-3
      const sortedIndices = serverIndices.sort(() => Math.random() - 0.5);
      return sortedIndices.slice(0, pickCount);
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const offset = (beamDuration / 8) * 1000;
    const intervalTime = beamDuration * 2 * 1000;

    // Initial timeout to offset the interval by duration/2
    const timeout = setTimeout(() => {
      updateActiveNodes();
      interval = setInterval(() => {
        updateActiveNodes();
      }, intervalTime);
    }, intervalTime - offset);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const beamProps = (isActive: boolean) => ({
    duration: beamDuration,
    reverse: isReverse,
    beamWidth: isActive && !isPending ? 10 : 0,
    pathOpacity: isActive ? 0.5 : 0.05,
    delay: 0.5,
  });

  const echoEndClassName = 'absolute h-full w-0 top-1/2 -translate-y-1/2';

  return (
    <div
      ref={containerRef}
      className="relative size-full flex items-center justify-between max-w-lg w-full"
    >
      <div className="flex flex-col gap-8">
        <Card {...cardProps(activeClientIndex === 0, 'left')}>
          <ClientIcon
            client={Clients.ClaudeCode}
            {...imageProps}
            className={cn(
              imageProps.className,
              activeClientIndex === 0 ? 'fill-primary' : 'fill-current'
            )}
          />
          <div
            className={targetRightClassName(activeClientIndex === 0)}
            ref={client1Ref}
          />
        </Card>
        <Card {...cardProps(activeClientIndex === 1, 'left')}>
          <ClientIcon
            client={Clients.Cursor}
            {...imageProps}
            className={cn(
              imageProps.className,
              activeClientIndex === 1 ? 'fill-primary' : 'fill-current'
            )}
          />
          <div
            className={targetRightClassName(activeClientIndex === 1)}
            ref={client2Ref}
          />
        </Card>
        <Card {...cardProps(activeClientIndex === 2, 'left')}>
          <ClientIcon
            client={Clients.Codex}
            {...imageProps}
            className={cn(
              imageProps.className,
              activeClientIndex === 2 ? 'fill-primary' : 'fill-current'
            )}
          />
          <div
            className={targetRightClassName(activeClientIndex === 2)}
            ref={client3Ref}
          />
        </Card>
      </div>
      <Chip>
        <div className={cn(echoEndClassName, 'left-10')} ref={echoLeftRef} />
        <div className={cn(echoEndClassName, 'right-10')} ref={echoRightRef} />
      </Chip>
      <div className="flex flex-col gap-8">
        <Card {...cardProps(activeServerIndices.includes(0), 'right')}>
          <ImageIcon
            {...imageProps}
            className={cn(
              imageProps.className,
              activeServerIndices.includes(0)
                ? 'stroke-primary'
                : 'stroke-current'
            )}
          />
          <div
            className={targetLeftClassName(activeServerIndices.includes(0))}
            ref={server1Ref}
          />
        </Card>
        <Card {...cardProps(activeServerIndices.includes(1), 'right')}>
          <Search
            {...imageProps}
            className={cn(
              imageProps.className,
              activeServerIndices.includes(1)
                ? 'stroke-primary'
                : 'stroke-current'
            )}
          />
          <div
            className={targetLeftClassName(activeServerIndices.includes(1))}
            ref={server2Ref}
          />
        </Card>
        <Card {...cardProps(activeServerIndices.includes(2), 'right')}>
          <ChartCandlestick
            {...imageProps}
            className={cn(
              imageProps.className,
              activeServerIndices.includes(2)
                ? 'stroke-primary'
                : 'stroke-current'
            )}
          />
          <div
            className={targetLeftClassName(activeServerIndices.includes(2))}
            ref={server3Ref}
          />
        </Card>
      </div>
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={client1Ref}
        startXOffset={2}
        endYOffset={-20}
        toRef={echoLeftRef}
        {...beamProps(activeClientIndex === 0)}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={client2Ref}
        toRef={echoLeftRef}
        {...beamProps(activeClientIndex === 1)}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={client3Ref}
        toRef={echoLeftRef}
        endYOffset={20}
        {...beamProps(activeClientIndex === 2)}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={server1Ref}
        toRef={echoRightRef}
        endYOffset={-20}
        {...beamProps(activeServerIndices.includes(0))}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={server2Ref}
        toRef={echoRightRef}
        {...beamProps(activeServerIndices.includes(1))}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={server3Ref}
        toRef={echoRightRef}
        endYOffset={20}
        {...beamProps(activeServerIndices.includes(2))}
      />
    </div>
  );
};
