import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

export const subLabelingSchema = z.object({
  tag: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  reasoning: z.string().optional(),
});

export const subcategoryGenerationSchema = z.object({
  subcategories: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      exampleResources: z.array(z.number()),
    })
  ),
});

export const feedbackSchema = z.object({
  problems: z.array(z.string()),
  suggestions: z.array(z.string()),
  severity: z.number().min(1).max(10),
});
