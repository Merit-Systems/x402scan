import type { ValidationResult, ResourceWithRelations } from './types';
import type { Subcategory } from './subcategories';
import type { Logger } from './logger';
import { defaultLogger } from './logger';
import { assignAllResources } from './assignment';
import { analyzeDistribution } from './distribution-analysis';
import { analyzeOverlap } from './overlap-analysis';
import { calculateQualityScore } from './quality-scoring';

// ============================================================================
// MAIN VALIDATION AND REFINEMENT PIPELINE
// ============================================================================

export async function validateAndRefineSubcategories(
  mainCategory: string,
  initialSubcategories: Subcategory[],
  resources: ResourceWithRelations[],
  sessionId: string,
  logger: Logger = defaultLogger
): Promise<ValidationResult> {
  const startTime = Date.now();

  logger.info(
    `\n${'='.repeat(60)}\nStarting subcategory assignment for ${mainCategory}`,
    {
      resources: resources.length,
      subcategories: initialSubcategories.length,
      sessionId,
    }
  );
  logger.info(
    `Subcategories: ${initialSubcategories.map(s => s.name).join(', ')}`
  );

  // 1. Assign all resources
  logger.info('Assigning resources to subcategories...');
  const { assignments, assignmentMap } = await assignAllResources(
    resources,
    initialSubcategories,
    mainCategory,
    sessionId,
    logger
  );

  // 2. Calculate metrics
  logger.info('Calculating distribution and overlap metrics...');
  const distMetrics = analyzeDistribution(assignmentMap);
  const overlapMetrics = analyzeOverlap(assignments);
  const qualityScore = calculateQualityScore(distMetrics, overlapMetrics);

  // Detailed metrics logging
  logger.info(`\n📊 Quality Metrics:`, {
    qualityScore: `${qualityScore.toFixed(1)}/100`,
    gini: distMetrics.gini.toFixed(3),
    ambiguityRate: `${(overlapMetrics.ambiguityRate * 100).toFixed(1)}%`,
    avgConfidenceGap: overlapMetrics.avgConfidenceGap.toFixed(3),
  });

  logger.info(`\n📈 Distribution Details:`);
  distMetrics.metrics.forEach(m => {
    const emoji = m.isEmpty ? '❌' : m.isDominating ? '⚠️' : '✓';
    logger.info(
      `  ${emoji} ${m.subcategory}: ${m.count} resources (${m.percentage.toFixed(1)}%)`,
      {
        isEmpty: m.isEmpty,
        isDominating: m.isDominating,
        isUnderutilized: m.isUnderutilized,
      }
    );
  });

  if (overlapMetrics.ambiguousAssignments.length > 0) {
    logger.warn(
      `⚠️ Found ${overlapMetrics.ambiguousAssignments.length} ambiguous assignments`
    );
    const topConflicts = Array.from(overlapMetrics.pairConflicts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    if (topConflicts.length > 0) {
      logger.warn(`Top conflicted pairs:`);
      topConflicts.forEach(([pair, count]) => {
        logger.warn(`  - ${pair.replace('|', ' ↔ ')}: ${count} conflicts`);
      });
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(
    `\n${'='.repeat(60)}\nAssignment completed in ${duration}s`,
    {
      qualityScore: qualityScore.toFixed(1),
    }
  );

  return {
    subcategories: initialSubcategories.map(s => s.name),
    qualityScore,
    distributionMetrics: distMetrics,
    overlapMetrics,
    finalAssignments: assignmentMap,
  };
}
