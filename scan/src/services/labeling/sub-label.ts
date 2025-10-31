// ============================================================================
// SUB-LABEL - Main entry point for subcategory labeling pipeline
// ============================================================================
//
// This module exports all functionality from the sub-label-pipeline modules.
// The pipeline has been organized into separate modules for better maintainability:
//
// - logger.ts: Logging utilities with colored console output
// - schemas.ts: Zod schemas for validation
// - subcategories.ts: Subcategory definitions and constants
// - types.ts: Shared TypeScript types and interfaces
// - distribution-analysis.ts: Distribution metrics and analysis
// - overlap-analysis.ts: Overlap detection and semantic similarity
// - deduplication.ts: Subcategory deduplication logic
// - quality-scoring.ts: Quality score calculation
// - llm-feedback.ts: LLM-based feedback and refinement
// - subcategory-generation.ts: Subcategory generation
// - assignment.ts: Resource assignment to subcategories
// - validation-pipeline.ts: Main validation and refinement pipeline
//
// See the README.md in sub-label-pipeline/ for detailed documentation.

// Re-export everything from the pipeline modules
export * from './sub-label-pipeline';
