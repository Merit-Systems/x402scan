import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { SearchResult } from './types';
import {
  sqlGenerationSchema,
  buildSearchPrompt,
  executeResourceSearch,
} from './database-search';

async function generateAndExecuteSingleQuery(
  naturalLanguageQuery: string,
  queryIndex: number
): Promise<{
  results: SearchResult[];
  explanation: string;
  sqlCondition: string;
} | null> {
  const maxRetries = 3;
  let lastError: { sql: string; error: string } | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await generateObject({
      model: openai('gpt-4.1-nano'),
      prompt: buildSearchPrompt(naturalLanguageQuery, lastError),
      schema: sqlGenerationSchema,
      temperature: 0.3, // Slightly higher temperature for variation
    });

    console.log(`Query ${queryIndex} - Attempt ${attempt + 1}:`, result.object);

    if (!result.object) {
      continue;
    }

    const { sqlQuery, explanation } = result.object;

    const executionResult = await executeResourceSearch(sqlQuery);

    if (executionResult.success) {
      return {
        results: executionResult.results,
        explanation,
        sqlCondition: sqlQuery,
      };
    }

    lastError = {
      sql: sqlQuery,
      error: executionResult.error,
    };
    console.log(
      `Query ${queryIndex} - SQL execution failed (attempt ${attempt + 1}/${maxRetries}):`,
      executionResult.error
    );
  }

  console.log(`Query ${queryIndex} - All retries exhausted`);
  return null;
}

export const searchResourcesWithNaturalLanguage = async (
  naturalLanguageQuery: string
): Promise<{
  results: SearchResult[];
  explanation: string;
  totalCount: number;
  sqlCondition: string;
}> => {
  if (!naturalLanguageQuery.trim()) {
    const allResults = await executeResourceSearch('true');
    if (!allResults.success) {
      throw new Error(`Failed to fetch all resources: ${allResults.error}`);
    }
    return {
      results: allResults.results,
      explanation: 'Showing all resources',
      totalCount: allResults.results.length,
      sqlCondition: 'true',
    };
  }

  console.log('Starting 3 parallel SQL generations...');

  // Run 3 generations in parallel
  const parallelQueries = await Promise.all([
    generateAndExecuteSingleQuery(naturalLanguageQuery, 1),
    generateAndExecuteSingleQuery(naturalLanguageQuery, 2),
    generateAndExecuteSingleQuery(naturalLanguageQuery, 3),
  ]);

  // Filter out failed queries
  const successfulQueries = parallelQueries.filter(
    (q): q is NonNullable<typeof q> => q !== null
  );

  if (successfulQueries.length === 0) {
    throw new Error('All 3 parallel query generations failed');
  }

  console.log(`Successfully executed ${successfulQueries.length}/3 queries`);

  // Combine results and deduplicate by resource ID
  const resultsMap = new Map<string, SearchResult>();

  for (const query of successfulQueries) {
    for (const result of query.results) {
      if (!resultsMap.has(result.id)) {
        resultsMap.set(result.id, result);
      }
    }
  }

  const combinedResults = Array.from(resultsMap.values());

  // Sort by lastUpdated descending
  combinedResults.sort(
    (a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()
  );

  // Combine explanations
  const combinedExplanation = successfulQueries
    .map((q, idx) => `Query ${idx + 1}: ${q.explanation}`)
    .join(' | ');

  // Combine SQL conditions
  const combinedSqlCondition = successfulQueries
    .map(q => `(${q.sqlCondition})`)
    .join(' OR ');

  return {
    results: combinedResults,
    explanation: combinedExplanation,
    totalCount: combinedResults.length,
    sqlCondition: combinedSqlCondition,
  };
};
