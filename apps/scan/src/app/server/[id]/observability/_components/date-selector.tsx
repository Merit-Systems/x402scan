'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const TIME_RANGES = [
  { label: '24 Hours', value: '1', hours: 24 },
  { label: '3 Days', value: '3', hours: 72 },
  { label: '7 Days', value: '7', hours: 168 },
  { label: '15 Days', value: '15', hours: 360 },
  { label: '30 Days', value: '30', hours: 720 },
] as const;

export const DateSelector = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get('range') || '1';

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      {TIME_RANGES.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => handleRangeChange(value)}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            currentRange === value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
