import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type {
  EnrichedSearchResult,
  FilterQuestion,
  FilteredSearchResult,
} from './types';

const filterQuestionsSchema = z.object({
  questions: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe('3-5 yes/no filter questions to evaluate each resource'),
  explanation: z
    .string()
    .describe('Brief explanation of what these filters are checking for'),
});

const filterEvaluationSchema = z.object({
  answer: z
    .boolean()
    .describe('Yes/no answer to whether this resource matches the criteria'),
  reasoning: z.string().describe('Brief reasoning for the answer'),
});

function buildFilterGenerationPrompt(naturalLanguageQuery: string): string {
  return `You are helping to filter API resources based on a user's search query.

User's Search Query: "${naturalLanguageQuery}"

Generate 3-5 specific yes/no questions that can be used to filter API resources based on this query.
Each question should help determine if a resource is relevant to what the user is looking for.

Guidelines:
- Questions should be specific and answerable with yes/no
- Focus on functionality, use case, technical requirements, or domain
- Avoid generic questions - make them specific to the query
- Questions should help distinguish highly relevant results from less relevant ones

Examples for "AI image generation":
1. Does this resource generate or create images?
2. Does this resource use AI or machine learning?
3. Is this resource designed for creative/artistic use cases?
4. Does this resource accept image-related parameters?

Generate your questions:`;
}

function buildFilterEvaluationPrompt(
  question: string,
  resource: EnrichedSearchResult
): string {
  const resourceContext = {
    title: resource.origin.title ?? resource.origin.origin,
    description:
      resource.accepts?.find(accept => accept.description)?.description ??
      'No description',
    origin: resource.origin.origin,
    tags: resource.tags.map(t => t.name).join(', ') || 'No tags',
    hasRecentUsage: resource.analytics
      ? resource.analytics.totalCalls > 0
      : false,
    sampleResponse: resource.analytics?.sampleResponseBody ?? null,
  };

  const responseSection = resourceContext.sampleResponse
    ? `- Sample Response: ${resourceContext.sampleResponse.slice(0, 500)}${resourceContext.sampleResponse.length > 500 ? '...' : ''}`
    : '';

  return `Evaluate if this API resource matches the following criteria.

Question: "${question}"

Resource Information:
- Title: ${resourceContext.title}
- Origin: ${resourceContext.origin}
- Description: ${resourceContext.description}
- Tags: ${resourceContext.tags}
- Has Recent Usage: ${resourceContext.hasRecentUsage ? 'Yes' : 'No'}
${responseSection}

Provide:
1. A yes/no answer (answer field) - true if the resource matches the criteria, false otherwise
2. Brief reasoning (reasoning field) - explain why you answered yes or no

Be strict but fair - only answer yes if there's clear evidence the resource matches.`;
}

export async function generateFilterQuestions(
  naturalLanguageQuery: string
): Promise<{ questions: FilterQuestion[]; explanation: string }> {
  if (!naturalLanguageQuery.trim()) {
    return {
      questions: [],
      explanation: 'No filters applied',
    };
  }

  try {
    const result = await generateObject({
      model: openai('gpt-4.1-nano'),
      prompt: buildFilterGenerationPrompt(naturalLanguageQuery),
      schema: filterQuestionsSchema,
      temperature: 0.3,
    });

    if (!result.object) {
      console.warn(
        '[Filter Generation] No object generated, returning empty filters'
      );
      return {
        questions: [],
        explanation: 'Failed to generate filter questions',
      };
    }

    const questions = result.object.questions.map((q, i) => ({
      question: q,
      index: i,
    }));

    return {
      questions,
      explanation: result.object.explanation,
    };
  } catch (error) {
    console.error(
      '[Filter Generation] Error generating filter questions:',
      error instanceof Error ? error.message : String(error)
    );
    return {
      questions: [],
      explanation: 'Failed to generate filter questions due to error',
    };
  }
}

async function evaluateResourceAgainstFilter(
  question: string,
  resource: EnrichedSearchResult
): Promise<boolean> {
  try {
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      prompt: buildFilterEvaluationPrompt(question, resource),
      schema: filterEvaluationSchema,
      temperature: 0.1,
    });

    if (!result.object) {
      console.warn('[Filter Evaluation] No object generated, returning false');
      return false;
    }

    return result.object.answer;
  } catch (error) {
    console.warn(
      '[Filter Evaluation] Error evaluating filter:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

export async function applyLLMFilters(
  results: EnrichedSearchResult[],
  filterQuestions: FilterQuestion[]
): Promise<FilteredSearchResult[]> {
  if (filterQuestions.length === 0) {
    return results.map(r => ({
      ...r,
      filterMatches: 0,
      filterAnswers: [],
    }));
  }

  // Evaluate each result against all filter questions
  const evaluatedResults = await Promise.all(
    results.map(async resource => {
      const answers = await Promise.all(
        filterQuestions.map(fq =>
          evaluateResourceAgainstFilter(fq.question, resource)
        )
      );

      const matchCount = answers.filter(Boolean).length;

      return {
        ...resource,
        filterMatches: matchCount,
        filterAnswers: answers,
      };
    })
  );

  // Sort by filter matches (highest first), then by existing relevance
  return evaluatedResults.sort((a, b) => {
    // Primary sort: filter matches
    if (a.filterMatches !== b.filterMatches) {
      return b.filterMatches - a.filterMatches;
    }

    // Secondary sort: keep existing analytics-based ordering
    if (!a.analytics && b.analytics) return 1;
    if (a.analytics && !b.analytics) return -1;

    return 0;
  });
}
