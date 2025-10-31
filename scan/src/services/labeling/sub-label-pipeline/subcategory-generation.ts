import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getTracer } from '@lmnr-ai/lmnr';
import type { ResourceWithRelations } from './types';
import type { Logger } from './logger';
import { defaultLogger } from './logger';
import { subcategoryGenerationSchema } from './schemas';

// ============================================================================
// SUBCATEGORY GENERATION
// ============================================================================

export async function generateSubcategories(
  mainCategory: string,
  resources: ResourceWithRelations[],
  sessionId: string,
  count: number = 5,
  logger: Logger = defaultLogger
): Promise<Array<{ name: string; description: string }>> {
  logger.info(`Generating ${count} subcategories for ${mainCategory}`, {
    totalResources: resources.length,
  });

  // Sample representative resources
  const sampleSize = Math.min(20, resources.length);
  const sampledResources = resources
    .sort(() => Math.random() - 0.5)
    .slice(0, sampleSize);

  logger.info(`Sampled ${sampleSize} representative resources for analysis`);

  const startTime = Date.now();
  const prompt = `
Category: ${mainCategory}

Here are ${sampleSize} representative resources from this category:
${sampledResources
  .map(
    (r, i) => `
${i}. Resource: ${r.resource.toString()}
   Description: ${r.accepts[0]?.description || 'No description'}
   Inputs: ${JSON.stringify(r.accepts[0]?.outputSchema || {})}
`
  )
  .join('\n')}

Task: Generate ${count} subcategories that would effectively organize these resources.

For each subcategory:
1. name: Clear, concise name (1-3 words, follows pattern of sibling categories)
2. description: One clear sentence explaining what belongs here
3. exampleResources: Array of resource numbers (0-${sampleSize - 1}) that would belong to it

Requirements:
- Each resource should have exactly one best-fit subcategory
- Distribution should be relatively balanced (no subcategory with >50% or <10%)
- Subcategories should be specific enough to be meaningful
- Must avoid overlap (clear boundaries between subcategories)
- Consider different dimensions: input type, output type, use case, technical approach

Think through the key dimensions that differentiate these resources before generating subcategories.
`;

  const result = await generateObject({
    model: openai('gpt-4.1'),
    prompt,
    schema: subcategoryGenerationSchema,
    temperature: 0.7,
    experimental_telemetry: {
      isEnabled: true,
      tracer: getTracer(),
      metadata: {
        sessionId,
        mainCategory,
        functionName: 'generateSubcategories',
      },
    },
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(
    `Generated ${result.object.subcategories.length} subcategories in ${duration}s`
  );

  result.object.subcategories.forEach((s, idx) => {
    logger.info(`  ${idx + 1}. ${s.name}: ${s.description}`);
  });

  return result.object.subcategories;
}
