'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { Card } from '@/components/ui/card';

import { AnimatedBeam } from '@/components/magicui/animated-beam';

import { cn } from '@/lib/utils';
import { Chip } from './chip';

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
    0, 1,
  ]);

  const cardClassName = (isActive: boolean) =>
    cn(
      'flex flex-col items-center justify-center p-2 z-10 bg-card relative transition-all duration-300 border-2',
      isActive ? 'border-primary shadow-primary shadow-[0_0_8px]' : 'opacity-50'
    );
  const imageSize = 32;
  const imageProps = {
    width: imageSize,
    height: imageSize,
  };
  const targetClassName = (isActive: boolean) =>
    cn(
      'absolute w-0 rounded-full size-1.5 bg-card border-2 border-primary z-10',
      isActive ? 'border-primary' : 'border-border'
    );
  const targetLeftClassName = (isActive: boolean) =>
    cn(targetClassName(isActive), '-left-1');
  const targetRightClassName = (isActive: boolean) =>
    cn(targetClassName(isActive), '-right-1');

  const beamDuration = 3;

  const [isReverse, setIsReverse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsReverse(prev => !prev);
    }, beamDuration * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => {
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
      },
      beamDuration * 2 * 1000
    );
    return () => clearInterval(interval);
  }, []);

  const beamProps = (isActive: boolean) => ({
    duration: beamDuration,
    reverse: isReverse,
    beamWidth: isActive ? 10 : 0,
    pathOpacity: isActive ? 0.2 : 0.05,
  });

  const echoEndClassName = 'absolute h-full w-0 top-1/2 -translate-y-1/2';

  return (
    <div
      ref={containerRef}
      className="relative size-full flex items-center justify-between max-w-lg w-full"
    >
      <div className="flex flex-col gap-8">
        <Card className={cardClassName(activeClientIndex === 0)}>
          <Image src="/icons/claude.png" alt="Claude Code" {...imageProps} />
          <div
            className={targetRightClassName(activeClientIndex === 0)}
            ref={client1Ref}
          />
        </Card>
        <Card className={cardClassName(activeClientIndex === 1)}>
          <Image
            src="/icons/cursor.png"
            alt="Cursor"
            {...imageProps}
            className="invert dark:invert-0"
          />
          <div
            className={targetRightClassName(activeClientIndex === 1)}
            ref={client2Ref}
          />
        </Card>
        <Card className={cardClassName(activeClientIndex === 2)}>
          <Image src="/icons/openai.png" alt="OpenAI" {...imageProps} />
          <div
            className={targetRightClassName(activeClientIndex === 2)}
            ref={client3Ref}
          />
        </Card>
      </div>
      <Chip>
        <div className={cn(echoEndClassName, 'left-0')} ref={echoLeftRef} />
        <div className={cn(echoEndClassName, 'right-0')} ref={echoRightRef} />
      </Chip>
      <div className="flex flex-col gap-2">
        <Card className={cardClassName(activeServerIndices.includes(0))}>
          <Image src="/thirdweb.png" alt="Github" {...imageProps} />
          <div
            className={targetLeftClassName(activeServerIndices.includes(0))}
            ref={server1Ref}
          />
        </Card>
        <Card className={cardClassName(activeServerIndices.includes(1))}>
          <Image src="/base.png" alt="X" {...imageProps} />
          <div
            className={targetLeftClassName(activeServerIndices.includes(1))}
            ref={server2Ref}
          />
        </Card>
        <Card className={cardClassName(activeServerIndices.includes(2))}>
          <Image src="/solana.png" alt="Google" {...imageProps} />
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
