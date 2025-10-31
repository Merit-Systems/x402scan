import { openai } from '@ai-sdk/openai';
import type { DeduplicationResult, ResourceWithRelations } from './types';
import type { Logger } from './logger';
import { defaultLogger } from './logger';

// ============================================================================
// DEDUPLICATION
// ============================================================================

// Helper function to compute cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Identifies and merges semantically similar subcategories where one has
 * significantly lower distribution than the other.
 *
 * Criteria for merging:
 * - Semantic similarity > 0.80 (cosine similarity of embeddings)
 * - One subcategory has <5% distribution AND the other has >10%
 * - Or the distribution ratio is >10:1
 */
export async function deduplicateSubcategories(
  subcategories: string[],
  assignmentMap: Map<string, ResourceWithRelations[]>,
  mainCategory: string,
  sessionId: string,
  logger: Logger = defaultLogger
): Promise<DeduplicationResult> {
  logger.info('Starting deduplication analysis...');

  if (subcategories.length <= 2) {
    logger.info('Too few subcategories to deduplicate');
    return {
      deduplicatedSubcategories: subcategories,
      mergeMap: new Map(),
      updatedAssignmentMap: assignmentMap,
      mergedCount: 0,
    };
  }

  const total = Array.from(assignmentMap.values()).reduce(
    (sum, resources) => sum + resources.length,
    0
  );

  // Calculate distributions
  const distributions = new Map<string, number>();
  subcategories.forEach(subcat => {
    const count = assignmentMap.get(subcat)?.length || 0;
    const percentage = total > 0 ? (count / total) * 100 : 0;
    distributions.set(subcat, percentage);
  });

  // Get embeddings for semantic similarity
  logger.info('Computing embeddings for semantic similarity...');
  const embeddings = await Promise.all(
    subcategories.map(async s => {
      const result = await openai.embedding('text-embedding-3-small').doEmbed({
        values: [s],
      });
      return result.embeddings[0];
    })
  );

  // Find similar pairs and decide which to merge
  const mergeMap = new Map<string, string>(); // small -> large
  const toRemove = new Set<string>();

  for (let i = 0; i < subcategories.length; i++) {
    for (let j = i + 1; j < subcategories.length; j++) {
      const similarity = cosineSimilarity(embeddings[i], embeddings[j]);

      if (similarity > 0.80) {
        const subcat1 = subcategories[i];
        const subcat2 = subcategories[j];
        const dist1 = distributions.get(subcat1) || 0;
        const dist2 = distributions.get(subcat2) || 0;

        // Determine which one to keep and which to merge
        let keep: string | null = null;
        let merge: string | null = null;

        // Rule 1: One is <5% and other is >10%
        if (dist1 < 5 && dist2 > 10) {
          keep = subcat2;
          merge = subcat1;
        } else if (dist2 < 5 && dist1 > 10) {
          keep = subcat1;
          merge = subcat2;
        }
        // Rule 2: Distribution ratio > 10:1
        else if (dist1 > 0 && dist2 / dist1 > 10) {
          keep = subcat2;
          merge = subcat1;
        } else if (dist2 > 0 && dist1 / dist2 > 10) {
          keep = subcat1;
          merge = subcat2;
        }

        if (keep && merge && !toRemove.has(keep) && !toRemove.has(merge)) {
          logger.info(
            `Merging "${merge}" (${dist1 === distributions.get(merge) ? dist1 : dist2}%) into "${keep}" (${dist1 === distributions.get(keep) ? dist1 : dist2}%)`,
            { similarity: similarity.toFixed(3) }
          );
          mergeMap.set(merge, keep);
          toRemove.add(merge);
        }
      }
    }
  }

  if (mergeMap.size === 0) {
    logger.info('No duplicates found to merge');
    return {
      deduplicatedSubcategories: subcategories,
      mergeMap: new Map(),
      updatedAssignmentMap: assignmentMap,
      mergedCount: 0,
    };
  }

  // Apply merges to assignment map
  const updatedAssignmentMap = new Map<string, ResourceWithRelations[]>();

  // Initialize with empty arrays for kept subcategories
  subcategories.forEach(subcat => {
    if (!toRemove.has(subcat)) {
      updatedAssignmentMap.set(subcat, []);
    }
  });

  // Redistribute resources
  assignmentMap.forEach((resources, subcat) => {
    const target = mergeMap.get(subcat) || subcat;
    if (!toRemove.has(target)) {
      const existing = updatedAssignmentMap.get(target) || [];
      updatedAssignmentMap.set(target, [...existing, ...resources]);
    }
  });

  const deduplicatedSubcategories = subcategories.filter(
    s => !toRemove.has(s)
  );

  logger.info(
    `Deduplication complete: ${subcategories.length} → ${deduplicatedSubcategories.length} subcategories`,
    { mergedCount: mergeMap.size }
  );

  return {
    deduplicatedSubcategories,
    mergeMap,
    updatedAssignmentMap,
    mergedCount: mergeMap.size,
  };
}
