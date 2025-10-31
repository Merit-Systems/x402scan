import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { getTracer } from '@lmnr-ai/lmnr';
import type {
  DistributionAnalysis,
  OverlapAnalysis,
  ResourceWithRelations,
} from './types';
import { feedbackSchema, subcategoryGenerationSchema } from './schemas';

// ============================================================================
// LLM-BASED FEEDBACK AND REFINEMENT
// ============================================================================

export async function getLLMQualityFeedback(
  mainCategory: string,
  subcategories: string[],
  assignments: Map<string, ResourceWithRelations[]>,
  distributionMetrics: DistributionAnalysis,
  overlapMetrics: OverlapAnalysis,
  sessionId: string
): Promise<z.infer<typeof feedbackSchema>> {
  const topConflicts = Array.from(overlapMetrics.pairConflicts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pair, count]) => `${pair} (${count} conflicts)`);

  const sampleAmbiguous = overlapMetrics.ambiguousAssignments
    .slice(0, 5)
    .map(
      a =>
        `- Resource ${a.resourceId}: conflicted between ${a.conflictedPair[0]} and ${a.conflictedPair[1]} (gap: ${a.confidenceGap.toFixed(2)})`
    )
    .join('\n');

  const prompt = `
Analyze these subcategories for the "${mainCategory}" category:

Subcategories:
${subcategories.map((s, i) => `${i + 1}. ${s} (${assignments.get(s)?.length || 0} resources, ${distributionMetrics.metrics[i]?.percentage.toFixed(1) || 0}%)`).join('\n')}

Distribution metrics:
- Gini coefficient: ${distributionMetrics.gini.toFixed(2)} (0=perfect equality, 1=total inequality)
- Standard deviation: ${distributionMetrics.stdDev.toFixed(1)}
- Mean resources per category: ${distributionMetrics.mean.toFixed(1)}
- Empty categories: ${distributionMetrics.emptyCategories}
- Dominating categories (>50%): ${distributionMetrics.dominatingCategories}
- Underutilized categories (<5%): ${distributionMetrics.underutilizedCategories}

Overlap metrics:
- Ambiguity rate: ${(overlapMetrics.ambiguityRate * 100).toFixed(1)}% (resources with <0.15 confidence gap)
- Average confidence gap: ${overlapMetrics.avgConfidenceGap.toFixed(2)}
- Most confused pairs: ${topConflicts.join(', ')}

Sample ambiguous assignments:
${sampleAmbiguous || 'None'}

Identify specific problems with this subcategory structure:
1. Are any subcategories too similar? Which ones and why?
2. Are any subcategories too broad/narrow causing imbalance?
3. Are there coverage gaps?
4. What specific changes would improve clarity and balance?

Provide actionable suggestions for refinement.
`;

  const result = await generateObject({
    model: openai('gpt-4.1'),
    prompt,
    schema: feedbackSchema,
    temperature: 0.3,
    experimental_telemetry: {
      isEnabled: true,
      tracer: getTracer(),
      metadata: {
        sessionId,
        mainCategory,
        functionName: 'getLLMQualityFeedback',
      },
    },
  });

  return result.object;
}

export async function refineSubcategories(
  mainCategory: string,
  currentSubcategories: string[],
  feedback: z.infer<typeof feedbackSchema>,
  assignments: Map<string, ResourceWithRelations[]>,
  distributionMetrics: DistributionAnalysis,
  sessionId: string
): Promise<string[]> {
  const problemsText = feedback.problems.join('\n- ');
  const suggestionsText = feedback.suggestions.join('\n- ');

  const sampleResources = Array.from(assignments.entries())
    .flatMap(([subcat, resources]) =>
      resources.slice(0, 3).map(r => ({
        subcat,
        name: r.resource.toString(),
        description: r.accepts[0]?.description || 'No description',
      }))
    )
    .slice(0, 15);

  const prompt = `
You are refining subcategories for the "${mainCategory}" category.

Current subcategories:
${currentSubcategories.map((s, i) => `${i + 1}. ${s} (${distributionMetrics.metrics[i]?.count || 0} resources)`).join('\n')}

Problems identified:
- ${problemsText}

Suggestions:
- ${suggestionsText}

Sample resources from this category:
${sampleResources.map(r => `- [${r.subcat}] ${r.name}: ${r.description}`).join('\n')}

Generate 5 improved subcategories that:
1. Address the identified problems
2. Maintain clear boundaries (minimal overlap)
3. Achieve better balance in distribution
4. Cover all resource types shown above

For each subcategory provide:
- name: Short, descriptive name (1-3 words)
- description: Clear one-sentence description
- exampleResources: Array of indices (0-${sampleResources.length - 1}) that would fit this subcategory

Ensure subcategories are mutually exclusive and collectively exhaustive.
`;

  const result = await generateObject({
    model: openai('gpt-4.1'),
    prompt,
    schema: subcategoryGenerationSchema,
    temperature: 0.5,
    experimental_telemetry: {
      isEnabled: true,
      tracer: getTracer(),
      metadata: {
        sessionId,
        mainCategory,
        functionName: 'refineSubcategories',
      },
    },
  });

  return result.object.subcategories.map(s => s.name);
}
