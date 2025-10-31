import type { listResourcesWithPagination } from '@/services/db/resources/resource';

// ============================================================================
// SHARED TYPES
// ============================================================================

// Extract the resource type from listResourcesWithPagination return value
export type ResourceWithRelations = Awaited<
  ReturnType<typeof listResourcesWithPagination>
>['items'][number];

// Assignment interfaces
export interface Assignment {
  resourceId: string;
  resource: ResourceWithRelations;
  primary: { subcategory: string; confidence: number };
  alternatives: Array<{ subcategory: string; confidence: number }>;
}

// Distribution metrics
export interface DistributionMetrics {
  subcategory: string;
  count: number;
  percentage: number;
  isEmpty: boolean;
  isDominating: boolean;
  isUnderutilized: boolean;
}

export interface DistributionAnalysis {
  metrics: DistributionMetrics[];
  gini: number;
  stdDev: number;
  mean: number;
  emptyCategories: number;
  dominatingCategories: number;
  underutilizedCategories: number;
}

// Overlap analysis
export interface OverlapAnalysis {
  ambiguityRate: number;
  avgConfidenceGap: number;
  pairConflicts: Map<string, number>;
  ambiguousAssignments: Array<{
    resourceId: string;
    confidenceGap: number;
    conflictedPair: [string, string];
  }>;
}

// Deduplication
export interface DeduplicationResult {
  deduplicatedSubcategories: string[];
  mergeMap: Map<string, string>; // old subcategory -> new subcategory
  updatedAssignmentMap: Map<string, ResourceWithRelations[]>;
  mergedCount: number;
}

// Validation result
export interface ValidationResult {
  subcategories: string[];
  qualityScore: number;
  distributionMetrics: DistributionAnalysis;
  overlapMetrics: OverlapAnalysis;
  finalAssignments: Map<string, ResourceWithRelations[]>;
}
