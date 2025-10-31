import { openai } from '@ai-sdk/openai';
import type { Assignment, OverlapAnalysis } from './types';

// ============================================================================
// OVERLAP ANALYSIS
// ============================================================================

export function analyzeOverlap(assignments: Assignment[]): OverlapAnalysis {
  const overlapMetrics = assignments.map(a => {
    const allScores = [a.primary, ...a.alternatives].sort(
      (x, y) => y.confidence - x.confidence
    );
    const topTwo = allScores.slice(0, 2);

    const confidenceGap =
      topTwo.length === 2
        ? topTwo[0].confidence - topTwo[1].confidence
        : topTwo[0].confidence;

    return {
      resourceId: a.resourceId,
      confidenceGap,
      isAmbiguous: confidenceGap < 0.15,
      conflictedPair:
        topTwo.length === 2
          ? [topTwo[0].subcategory, topTwo[1].subcategory]
          : [topTwo[0].subcategory, topTwo[0].subcategory],
    };
  });

  const pairConflicts = new Map<string, number>();
  const ambiguous = overlapMetrics.filter(m => m.isAmbiguous);

  ambiguous.forEach(m => {
    const key = (m.conflictedPair as string[]).sort().join('|');
    pairConflicts.set(key, (pairConflicts.get(key) || 0) + 1);
  });

  const ambiguityRate =
    assignments.length > 0 ? ambiguous.length / assignments.length : 0;

  const avgConfidenceGap =
    overlapMetrics.length > 0
      ? overlapMetrics.reduce((sum, m) => sum + m.confidenceGap, 0) /
        overlapMetrics.length
      : 0;

  return {
    ambiguityRate,
    avgConfidenceGap,
    pairConflicts,
    ambiguousAssignments: ambiguous.map(m => ({
      resourceId: m.resourceId,
      confidenceGap: m.confidenceGap,
      conflictedPair: m.conflictedPair as [string, string],
    })),
  };
}

// Helper function to compute cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function analyzeSemanticOverlap(
  subcategories: Array<{ name: string; description: string }>
): Promise<{
  similarities: Array<{ pair: [string, string]; similarity: number }>;
  highOverlap: Array<{ pair: [string, string]; similarity: number }>;
  avgSimilarity: number;
}> {
  // Get embeddings for each subcategory
  const embeddings = await Promise.all(
    subcategories.map(async s => {
      const result = await openai.embedding('text-embedding-3-small').doEmbed({
        values: [`${s.name}: ${s.description}`],
      });
      return result.embeddings[0];
    })
  );

  const similarities: Array<{ pair: [string, string]; similarity: number }> =
    [];

  for (let i = 0; i < subcategories.length; i++) {
    for (let j = i + 1; j < subcategories.length; j++) {
      const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
      similarities.push({
        pair: [subcategories[i].name, subcategories[j].name],
        similarity,
      });
    }
  }

  const highOverlap = similarities.filter(s => s.similarity > 0.7);
  const avgSimilarity =
    similarities.length > 0
      ? similarities.reduce((sum, s) => sum + s.similarity, 0) /
        similarities.length
      : 0;

  return { similarities, highOverlap, avgSimilarity };
}
