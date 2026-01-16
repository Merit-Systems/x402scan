'use client';

import { Logo } from '@/components/logo';
import { Card } from '@/components/ui/card';

interface Props {
  children: React.ReactNode;
}

export const Chip: React.FC<Props> = ({ children }) => {
  return (
    <div className="relative size-24">
      <Card className="size-24 flex flex-col items-center justify-center border-primary shadow-primary shadow-[0_0_8px] border-2 relative">
        <Logo className="size-16" />
      </Card>
      {topPins.map(([offset, length], i) => (
        <Line
          key={`top-${i}`}
          side="top"
          offset={offset}
          length={length}
          index={i}
        />
      ))}
      {bottomPins.map(([offset, length], i) => (
        <Line
          key={`bottom-${i}`}
          side="bottom"
          offset={offset}
          length={length}
          index={i + topPins.length}
        />
      ))}

      <style jsx>{`
        @keyframes aurora-pulse {
          0%,
          100% {
            opacity: 0.6;
            filter: brightness(1);
          }
          50% {
            opacity: 1;
            filter: brightness(1.5);
          }
        }
        @keyframes aurora-gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
      {children}
    </div>
  );
};

interface LineProps {
  side: 'top' | 'bottom' | 'left' | 'right';
  length: number;
  offset: number;
  index: number;
}

const Line: React.FC<LineProps> = ({ side, length, offset, index }) => {
  const isVertical = side === 'top' || side === 'bottom';
  const baseClasses = 'absolute';

  const styles: Record<typeof side, string> = {
    top: `${baseClasses} w-0.5 -top-${length} left-[${offset}%] -translate-x-1/2 rounded-t-full`,
    bottom: `${baseClasses} w-0.5 -bottom-${length} left-[${offset}%] -translate-x-1/2 rounded-b-full`,
    left: `${baseClasses} h-0.5 -left-${length} top-[${offset}%] -translate-y-1/2 rounded-l-full`,
    right: `${baseClasses} h-0.5 -right-${length} top-[${offset}%] -translate-y-1/2 rounded-r-full`,
  };

  const dimensionStyles: Record<typeof side, React.CSSProperties> = {
    top: { height: `${length * 4}px`, left: `${offset}%` },
    bottom: { height: `${length * 4}px`, left: `${offset}%` },
    left: { width: `${length * 4}px`, top: `${offset}%` },
    right: { width: `${length * 4}px`, top: `${offset}%` },
  };

  const positionStyles: Record<typeof side, React.CSSProperties> = {
    top: { top: `-${length * 4}px` },
    bottom: { bottom: `-${length * 4}px` },
    left: { left: `-${length * 4}px` },
    right: { right: `-${length * 4}px` },
  };

  // Aurora gradient: primary color fading to transparent
  const gradientDirection = isVertical ? 'to bottom' : 'to right';
  const animationDelay = index * 0.15; // Stagger animations

  const auroraStyles: React.CSSProperties = {
    background: `linear-gradient(${gradientDirection},
      var(--primary),
      color-mix(in oklch, var(--primary), transparent 60%),
      var(--primary),
      color-mix(in oklch, var(--primary), transparent 60%))`,
    backgroundSize: isVertical ? '100% 300%' : '300% 100%',
    animation: `aurora-gradient 2s ease infinite, aurora-pulse 1.5s ease-in-out infinite`,
    animationDelay: `${animationDelay}s, ${animationDelay}s`,
    animationFillMode: 'backwards',
  };

  return (
    <div
      className={styles[side]}
      style={{
        ...dimensionStyles[side],
        ...positionStyles[side],
        ...auroraStyles,
      }}
    />
  );
};

// Pin configurations: [offset percentage, length multiplier]
const topPins: [number, number][] = [
  [20, 4],
  [40, 6],
  [60, 5],
  [80, 4],
];
const bottomPins: [number, number][] = [
  [20, 5],
  [40, 4],
  [60, 6],
  [80, 5],
];
