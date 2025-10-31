import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getTracer } from '@lmnr-ai/lmnr';
import type { Assignment, ResourceWithRelations } from './types';
import type { Subcategory } from './subcategories';
import type { Logger } from './logger';
import { defaultLogger } from './logger';
import { subLabelingSchema } from './schemas';

// ============================================================================
// ASSIGNMENT FUNCTIONS
// ============================================================================

async function assignResourceToSubcategory(
  resource: ResourceWithRelations,
  subcategories: Subcategory[],
  mainCategory: string,
  sessionId: string
): Promise<Assignment> {
  const resourceDescription = `
    RESOURCE DESCRIPTIONS:
    ${resource.accepts.map(accept => `- ${accept.description}`).join('\n')}

    RESOURCE INPUT PARAMETERS (if applicable):
    ${JSON.stringify(resource.accepts.map(accept => accept.outputSchema))}
    `;

  const prompt = `
Assign this ${mainCategory} resource to the most appropriate subcategory.

${resourceDescription}

Available subcategories:
${subcategories.map((s, i) => `${i + 1}. ${s.name}: ${s.description}`).join('\n')}

Choose the best subcategory. Provide your confidence (0-1) and brief reasoning.
`;

  const result = await generateObject({
    model: openai('gpt-4.1-mini'),
    prompt,
    schema: subLabelingSchema,
    temperature: 0.1,
    experimental_telemetry: {
      isEnabled: true,
      tracer: getTracer(),
      metadata: {
        resourceId: resource.id,
        sessionId,
        mainCategory,
        functionName: 'assignResourceToSubcategory',
      },
    },
  });

  // For overlap analysis, we'd ideally get all subcategory scores
  // For now, we'll simulate by just having the primary
  return {
    resourceId: resource.id,
    resource,
    primary: {
      subcategory: result.object.tag,
      confidence: result.object.confidence || 0.9,
    },
    alternatives: [], // Could enhance to get multiple options
  };
}

export async function assignAllResources(
  resources: ResourceWithRelations[],
  subcategories: Subcategory[],
  mainCategory: string,
  sessionId: string,
  logger: Logger = defaultLogger
): Promise<{
  assignments: Assignment[];
  assignmentMap: Map<string, ResourceWithRelations[]>;
}> {
  logger.info(
    `Starting resource assignment for ${resources.length} resources`,
    { mainCategory, subcategoryCount: subcategories.length }
  );

  const startTime = Date.now();
  let completed = 0;

  // Process in batches for better progress tracking
  const batchSize = 100;
  const assignments: Assignment[] = [];

  for (let i = 0; i < resources.length; i += batchSize) {
    const batch = resources.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(r =>
        assignResourceToSubcategory(r, subcategories, mainCategory, sessionId)
      )
    );

    assignments.push(...batchResults);
    completed += batch.length;

    logger.progress(
      completed,
      resources.length,
      `Assigned ${completed}/${resources.length} resources`
    );
  }

  const assignmentMap = new Map<string, ResourceWithRelations[]>();
  subcategories.forEach(s => assignmentMap.set(s.name, []));

  assignments.forEach(a => {
    const existing = assignmentMap.get(a.primary.subcategory) || [];
    assignmentMap.set(a.primary.subcategory, [...existing, a.resource]);
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(`Assignment complete in ${duration}s`, {
    avgConfidence:
      assignments.reduce((sum, a) => sum + a.primary.confidence, 0) /
      assignments.length,
  });

  return { assignments, assignmentMap };
}
