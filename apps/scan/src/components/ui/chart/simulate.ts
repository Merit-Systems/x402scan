import type { ChartData } from "./types";

interface SimulateChartDataOptions {
  baseValue?: number;
  points?: number;
  seed?: number;
  variance?: number;
}

function simulateChartData({
  baseValue = 24,
  points = 48,
  seed = 42,
  variance = 6,
}: SimulateChartDataOptions = {}): ChartData<{ value: number }>[] {
  let state = seed >>> 0;
  let currentValue = baseValue;

  return Array.from({ length: Math.max(2, points) }, (_, index) => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    const normalized = state / 4_294_967_296;

    if (index > 0) {
      currentValue += (normalized - 0.5) * 2 * variance;
    }

    return {
      timestamp: String(index),
      value: Math.max(0, Math.round(currentValue)),
    };
  });
}

export { simulateChartData };
export type { SimulateChartDataOptions };
