import type {
  DistributionMetrics,
  DistributionAnalysis,
  ResourceWithRelations,
} from './types';

// ============================================================================
// DISTRIBUTION ANALYSIS
// ============================================================================

function calculateGini(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);

  if (sum === 0) return 0;

  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (2 * (i + 1) - n - 1) * sorted[i];
  }

  return numerator / (n * sum);
}

export function analyzeDistribution(
  assignments: Map<string, ResourceWithRelations[]>
): DistributionAnalysis {
  const total = Array.from(assignments.values()).reduce(
    (sum, resources) => sum + resources.length,
    0
  );

  const metrics: DistributionMetrics[] = Array.from(assignments.entries()).map(
    ([subcat, resources]) => {
      const count = resources.length;
      const percentage = total > 0 ? (count / total) * 100 : 0;

      return {
        subcategory: subcat,
        count,
        percentage,
        isEmpty: count === 0,
        isDominating: percentage > 50,
        isUnderutilized: percentage < 5 && count > 0,
      };
    }
  );

  const counts = metrics.map(m => m.count);
  const gini = calculateGini(counts);

  const mean = total / assignments.size;
  const variance =
    counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) /
    counts.length;
  const stdDev = Math.sqrt(variance);

  const emptyCategories = metrics.filter(m => m.isEmpty).length;
  const dominatingCategories = metrics.filter(m => m.isDominating).length;
  const underutilizedCategories = metrics.filter(m => m.isUnderutilized).length;

  return {
    metrics,
    gini,
    stdDev,
    mean,
    emptyCategories,
    dominatingCategories,
    underutilizedCategories,
  };
}
