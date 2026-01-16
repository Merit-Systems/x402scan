'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { Card } from '@/components/ui/card';

import { AnimatedBeam } from '@/components/magicui/animated-beam';

import { cn } from '@/lib/utils';
import { Chip } from './chip';

export const HeroGraphic = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const user1Ref = useRef<HTMLDivElement>(null);
  const user2Ref = useRef<HTMLDivElement>(null);
  const user3Ref = useRef<HTMLDivElement>(null);
  const echoLeftRef = useRef<HTMLDivElement>(null);
  const echoRightRef = useRef<HTMLDivElement>(null);
  const model1Ref = useRef<HTMLDivElement>(null);
  const model2Ref = useRef<HTMLDivElement>(null);
  const model3Ref = useRef<HTMLDivElement>(null);

  const cardClassName =
    'flex flex-col items-center justify-center p-2 z-10 bg-card relative';
  const imageSize = 32;
  const imageProps = {
    width: imageSize,
    height: imageSize,
  };
  const targetClassName = 'absolute w-2 h-full z-10';
  const targetLeftClassName = cn(targetClassName, 'left-0');
  const targetRightClassName = cn(targetClassName, 'right-0');

  const beamDuration = 3;

  const [isReverse, setIsReverse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsReverse(prev => !prev);
    }, beamDuration * 1000);
    return () => clearInterval(interval);
  }, []);

  const beamProps = {
    duration: beamDuration,
    reverse: isReverse,
  };

  const echoEndClassName = 'absolute h-full w-0 top-1/2 -translate-y-1/2';

  return (
    <div
      ref={containerRef}
      className="relative size-full flex items-center justify-between max-w-lg w-full"
    >
      <div className="flex flex-col gap-8">
        <Card className={cardClassName}>
          <Image src="/icons/claude.png" alt="Claude Code" {...imageProps} />
          <div className={targetRightClassName} ref={user1Ref} />
        </Card>
        <Card className={cardClassName}>
          <Image
            src="/icons/cursor.png"
            alt="Cursor"
            {...imageProps}
            className="invert dark:invert-0"
          />
          <div className={targetRightClassName} ref={user2Ref} />
        </Card>
        <Card className={cardClassName}>
          <Image src="/icons/openai.png" alt="OpenAI" {...imageProps} />
          <div className={targetRightClassName} ref={user3Ref} />
        </Card>
      </div>
      <Chip>
        <div className={cn(echoEndClassName, 'left-0')} ref={echoLeftRef} />
        <div className={cn(echoEndClassName, 'right-0')} ref={echoRightRef} />
      </Chip>
      <div className="flex flex-col gap-2">
        <Card className={cardClassName}>
          <Image src="/icons/github.svg" alt="Github" {...imageProps} />
          <div className={targetLeftClassName} ref={model1Ref} />
        </Card>
        <Card className={cardClassName}>
          <Image src="/icons/x.svg" alt="X" {...imageProps} />
          <div className={targetLeftClassName} ref={model2Ref} />
        </Card>
        <Card className={cardClassName}>
          <Image src="/icons/google.svg" alt="Google" {...imageProps} />
          <div className={targetLeftClassName} ref={model3Ref} />
        </Card>
      </div>
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={user1Ref}
        endYOffset={-20}
        toRef={echoLeftRef}
        {...beamProps}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={user2Ref}
        toRef={echoLeftRef}
        {...beamProps}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={user3Ref}
        toRef={echoLeftRef}
        endYOffset={20}
        {...beamProps}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={model1Ref}
        toRef={echoRightRef}
        endYOffset={-20}
        {...beamProps}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={model2Ref}
        toRef={echoRightRef}
        {...beamProps}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={model3Ref}
        toRef={echoRightRef}
        endYOffset={20}
        {...beamProps}
      />
    </div>
  );
};
