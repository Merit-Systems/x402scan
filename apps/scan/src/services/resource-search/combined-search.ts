import type { CombinedRefinedResult, FilterQuestion, RefinementMode, QueryMode } from './types';
import { searchResourcesWithNaturalLanguage as searchWithKeywords } from './database-tags-search';
import { searchResourcesWithNaturalLanguage as searchWithSQL } from './database-search';
import { enrichSearchResults } from './clickhouse-search';
import { generateFilterQuestions, applyLLMFilters } from './llm-refined-search';
import { rerankSearchResults } from './reranker-search';

/**
 * Performs a combined search that:
 * 1. DB search with optional parallel filter question generation
 * 2. Enriches results with ClickHouse analytics
 * 3. Applies selected refinement method(s): LLM filters, reranker, both, or none
 * 4. Returns results in the order provided by the LLM/reranker
 */
export async function searchResourcesCombined(
  naturalLanguageQuery: string,
  options?: { refinementMode?: RefinementMode; queryMode?: QueryMode }
): Promise<{
  results: CombinedRefinedResult[];
  explanation: string;
  totalCount: number;
  sqlCondition: string;
  keywords: string[];
  filterQuestions: FilterQuestion[];
  filterExplanation: string;
}> {
  const startTime = Date.now();
  const refinementMode = options?.refinementMode ?? 'none';
  const queryMode = options?.queryMode ?? 'keywords';
  
  const useLlmFilter = refinementMode === 'llm' || refinementMode === 'both';
  
  // Select the appropriate search function based on queryMode
  const searchFunction = queryMode === 'sql' ? searchWithSQL : searchWithKeywords;
  
  // Step 1: DB search and optionally parallelize with filter question generation
  const step1Start = Date.now();
  let dbResults;
  let filterQuestions: FilterQuestion[] = [];
  let filterExplanation = refinementMode === 'none' 
    ? 'No refinement applied' 
    : `Refinement mode: ${refinementMode}`;
  
  if (useLlmFilter) {
    [dbResults, { questions: filterQuestions, explanation: filterExplanation }] = await Promise.all([
      searchFunction(naturalLanguageQuery),
      generateFilterQuestions(naturalLanguageQuery)
    ]);
    console.log(`[Search] Step 1 - Parallel DB search (${queryMode}) + filter generation: ${Date.now() - step1Start}ms (${dbResults.results.length} results, ${filterQuestions.length} questions)`);
  } else {
    dbResults = await searchFunction(naturalLanguageQuery);
    console.log(`[Search] Step 1 - DB search (${queryMode}) only: ${Date.now() - step1Start}ms (${dbResults.results.length} results)`);
  }

  // Step 2: Enrich with ClickHouse analytics
  const step2Start = Date.now();
  const enrichedResults = await enrichSearchResults(dbResults.results);
  const step2Duration = Date.now() - step2Start;
  console.log(`[Search] Step 2 - ClickHouse enrichment: ${step2Duration}ms`);

  let finalResults: CombinedRefinedResult[];

  if (refinementMode === 'none') {
    // No refinement - return enriched results as-is
    finalResults = enrichedResults.map(r => ({
      ...r,
      filterMatches: 0,
      filterAnswers: [],
      rerankerScore: null,
      rerankerIndex: null,
    }));
    console.log(`[Search] Step 3 - Skipped (no refinement)`);
  } else if (refinementMode === 'llm') {
    // LLM filtering only - trust LLM ordering
    const step3Start = Date.now();
    const results = await applyLLMFilters(enrichedResults, filterQuestions);
    console.log(`[Search] Step 3 - LLM filter: ${Date.now() - step3Start}ms (${results.length} results)`);
    
    finalResults = results.map(r => ({
      ...r,
      rerankerScore: null,
      rerankerIndex: null,
    }));
  } else if (refinementMode === 'reranker') {
    // Reranker only - trust reranker ordering
    const step3Start = Date.now();
    const results = await rerankSearchResults(enrichedResults, naturalLanguageQuery);
    console.log(`[Search] Step 3 - Reranker: ${Date.now() - step3Start}ms (${results.length} results)`);
    
    finalResults = results.map(r => ({
      ...r,
      filterMatches: 0,
      filterAnswers: [],
    }));
  } else {
    // Both LLM and reranker - use reranker for final ordering
    const step3Start = Date.now();
    const [llmResults, rerankedResults] = await Promise.all([
      applyLLMFilters(enrichedResults, filterQuestions),
      rerankSearchResults(enrichedResults, naturalLanguageQuery)
    ]);
    console.log(`[Search] Step 3 - Parallel LLM + Reranker: ${Date.now() - step3Start}ms`);

    // Use reranker order, but include LLM filter data
    finalResults = rerankedResults.map((rerankedResult) => {
      const llmResult = llmResults.find(r => r.id === rerankedResult.id);
      return {
        ...rerankedResult,
        filterMatches: llmResult?.filterMatches ?? 0,
        filterAnswers: llmResult?.filterAnswers ?? [],
      };
    });
  }

  const totalDuration = Date.now() - startTime;
  console.log(`[Search] Total duration: ${totalDuration}ms`);

  return {
    results: finalResults,
    explanation: dbResults.explanation,
    totalCount: dbResults.totalCount,
    sqlCondition: dbResults.sqlCondition,
    keywords: ('keywords' in dbResults ? dbResults.keywords : []) as string[],
    filterQuestions,
    filterExplanation,
  };
}

