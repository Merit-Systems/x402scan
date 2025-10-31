import type { DistributionAnalysis, OverlapAnalysis } from './types';

// ============================================================================
// QUALITY SCORING
// ============================================================================

export function calculateQualityScore(
  distribution: DistributionAnalysis,
  overlap: OverlapAnalysis
): number {
  // Distribution score (0-70 points)
  const distScore =
    (1 - distribution.gini) * 40 + // 40 points for balance (Gini)
    (distribution.emptyCategories === 0 ? 20 : 0) + // 20 points for no empty
    (distribution.dominatingCategories === 0 ? 10 : 0); // 10 points for no dominating

  // Overlap score (0-30 points)
  const overlapScore = (1 - overlap.ambiguityRate) * 30; // 30 points for low ambiguity

  return distScore + overlapScore;
}
