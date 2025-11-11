'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const TIME_RANGES = [
  { label: '24 Hours', value: '1' },
  { label: '3 Days', value: '3' },
  { label: '7 Days', value: '7' },
  { label: '15 Days', value: '15' },
  { label: '30 Days', value: '30' },
] as const;

export const DateSelector = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get('range') || '1';

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', e.target.value);
    router.push(`?${params.toString()}`);
  };

  return (
    <select
      value={currentRange}
      onChange={handleRangeChange}
      className="px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {TIME_RANGES.map(({ label, value }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
};
