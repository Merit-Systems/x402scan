import { subDays, format } from 'date-fns';

import type { ChartData } from './types';

interface Props {
  baseValue?: number;
  variance?: number;
  days?: number;
}

export const simulateChartData = ({
  baseValue = 10,
  variance = 20,
  days = 48,
}: Props = {}) => {
  const data: ChartData<{ value: number }>[] = [];
  let currentValue = baseValue;

  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    // Increment can be positive or negative, with some random variation
    const increment = (Math.random() - 0.5) * 2 * variance; // Range: -variance to +variance
    if (i !== days) {
      currentValue += increment;
    }
    data.push({
      timestamp: format(date, 'MMM dd'),
      value: Math.max(0, Math.round(currentValue)),
    });
  }

  return data;
};
