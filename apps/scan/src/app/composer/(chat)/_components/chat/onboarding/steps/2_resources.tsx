import { AnimatedBeam, Circle } from '@/components/magicui/animated-beam';
import { cn } from '@/lib/utils';
import { Bot, MessagesSquare, Server, User } from 'lucide-react';
import { useRef } from 'react';

export const ResourcesStep = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);
  const botRef = useRef<HTMLDivElement>(null);
  const server1Ref = useRef<HTMLDivElement>(null);
  const server2Ref = useRef<HTMLDivElement>(null);

  const circleClassName = 'p-2 md:p-3 bg-card';
  const iconClassName = 'size-4 md:size-6';

  return (
    <div
      className="relative w-full max-w-full overflow-hidden"
      ref={containerRef}
    >
      <div className="flex items-center justify-between gap-4">
        <Circle ref={walletRef} className={circleClassName}>
          <User className={iconClassName} />
        </Circle>
        <Circle
          ref={botRef}
          className={cn(circleClassName, 'border-primary text-primary')}
        >
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
        fromRef={walletRef}
        toRef={botRef}
        containerRef={containerRef}
        {...beamProps}
      />
      <AnimatedBeam
        fromRef={server1Ref}
        toRef={botRef}
        containerRef={containerRef}
        {...beamProps}
      />
      <AnimatedBeam
        fromRef={server2Ref}
        toRef={botRef}
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
