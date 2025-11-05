import type { CombinedRefinedResult, FilterQuestion, EnrichedSearchResult, RefinementMode, QueryMode } from './types';
import { searchResourcesWithNaturalLanguage as searchWithKeywords } from './database-tags-search';
import { searchResourcesWithNaturalLanguage as searchWithSQL } from './database-search';
import { enrichSearchResults } from './clickhouse-search';
import { generateFilterQuestions, applyLLMFilters } from './llm-refined-search';
import { rerankSearchResults } from './reranker-search';

interface ScoredResult extends CombinedRefinedResult {
  score: number;
  scoreBreakdown: {
    llmFilterScore: number;
    rerankerScore: number;
    databaseRankScore: number;
    analyticsScore: number;
  };
}

/**
 * Calculate a composite score for each result based on multiple factors
 */
function calculateResultScore(
  result: CombinedRefinedResult,
  index: number,
  totalResults: number,
  maxFilterMatches: number,
  refinementMode: RefinementMode
): ScoredResult {
  // Weight configuration based on refinement mode
  let WEIGHTS: {
    llmFilter: number;
    reranker: number;
    databaseRank: number;
    analytics: number;
  };

  switch (refinementMode) {
    case 'llm':
      WEIGHTS = {
        llmFilter: 0.5,
        reranker: 0,
        databaseRank: 0.2,
        analytics: 0.3,
      };
      break;
    case 'reranker':
      WEIGHTS = {
        llmFilter: 0,
        reranker: 0.5,
        databaseRank: 0.2,
        analytics: 0.3,
      };
      break;
    case 'both':
      WEIGHTS = {
        llmFilter: 0.3,
        reranker: 0.3,
        databaseRank: 0.15,
        analytics: 0.25,
      };
      break;
    case 'none':
    default:
      WEIGHTS = {
        llmFilter: 0,
        reranker: 0,
        databaseRank: 0.5,
        analytics: 0.5,
      };
      break;
  }

  // LLM Filter Score (0-1): Based on filter match percentage
  const llmFilterScore = maxFilterMatches > 0 
    ? result.filterMatches / maxFilterMatches 
    : 0;

  // Reranker Score (0-1): Normalize reranker score
  // Jina reranker typically returns scores between -1 and 1, with higher being better
  const rerankerScoreNormalized = result.rerankerScore !== null
    ? Math.max(0, Math.min(1, (result.rerankerScore + 1) / 2))
    : 0;

  // Database Rank Score (0-1): Earlier results from DB get higher scores
  const databaseRankScore = totalResults > 1
    ? 1 - (index / (totalResults - 1))
    : 1;

  // Analytics Score (0-1): Based on ClickHouse metrics
  let analyticsScore = 0;
  if (result.analytics) {
    // Usage subscore (50% of analytics): Higher total calls = more popular
    const usageScore = Math.min(1, result.analytics.totalCalls / 1000);
    
    // Performance subscore (25% of analytics): Lower duration is better (max 5s)
    const performanceScore = 1 - Math.min(1, result.analytics.avgDuration / 5000);
    
    // Success rate subscore (25% of analytics): Higher success rate is better
    const successScore = result.analytics.successRate;
    
    analyticsScore = (
      usageScore * 0.5 +
      performanceScore * 0.25 +
      successScore * 0.25
    );
  }

  // Calculate weighted composite score
  const score = (
    llmFilterScore * WEIGHTS.llmFilter +
    rerankerScoreNormalized * WEIGHTS.reranker +
    databaseRankScore * WEIGHTS.databaseRank +
    analyticsScore * WEIGHTS.analytics
  );

  return {
    ...result,
    score,
    scoreBreakdown: {
      llmFilterScore,
      rerankerScore: rerankerScoreNormalized,
      databaseRankScore,
      analyticsScore,
    },
  };
}

/**
 * Calculate a popularity score for sorting resources
 */
function calculatePopularityScore(result: EnrichedSearchResult): number {
  if (!result.analytics) {
    return 0;
  }

  // Popularity heavily weighted by total calls with minor success rate adjustment
  // Using sqrt instead of log10 to preserve more of the usage difference
  const usageScore = Math.sqrt(result.analytics.totalCalls);
  
  // Success rate adds a small bonus (0-20% boost) rather than being a multiplier
  const successBonus = result.analytics.successRate * 0.2;

  return usageScore * (1 + successBonus);
}

/**
 * Filters enriched results to top 20 by popularity
 * This reduces the number of results sent to the LLM and prioritizes popular resources
 */
function filterByQualityMetrics(
  enrichedResults: EnrichedSearchResult[]
): EnrichedSearchResult[] {
  if (enrichedResults.length <= 20) {
    return enrichedResults;
  }

  // Sort by popularity score (highest first) and take top 20
  return enrichedResults
    .sort((a, b) => calculatePopularityScore(b) - calculatePopularityScore(a))
    .slice(0, 20);
}

/**
 * Performs a combined search that:
 * 1. Parallelizes DB search and refinement preparation (LLM filter questions, reranker)
 * 2. Enriches results with ClickHouse analytics
 * 3. Filters by quality metrics (uptime, invocations, success rate)
 * 4. Applies selected refinement method(s): LLM filters, reranker, both, or none
 * 5. Sorts by weighted composite score based on refinement mode
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

  // Step 3: Filter by quality metrics to reduce irrelevant results before refinement
  const step3Start = Date.now();
  const qualityFilteredResults = filterByQualityMetrics(enrichedResults);
  const step3Duration = Date.now() - step3Start;
  console.log(`[Search] Step 3 - Quality filtering: ${step3Duration}ms (${enrichedResults.length} → ${qualityFilteredResults.length} results)`);

  let finalResults: CombinedRefinedResult[];

  if (refinementMode === 'none') {
    // No refinement - convert enriched results to combined format
    finalResults = qualityFilteredResults.map(r => ({
      ...r,
      filterMatches: 0,
      filterAnswers: [],
      rerankerScore: null,
      rerankerIndex: null,
    }));
    console.log(`[Search] Step 4-5 - Skipped (no refinement)`);
  } else if (refinementMode === 'llm') {
    // LLM filtering only
    const step4Start = Date.now();
    const results = await applyLLMFilters(qualityFilteredResults, filterQuestions);
    const step4Duration = Date.now() - step4Start;
    console.log(`[Search] Step 4 - LLM filter evaluation: ${step4Duration}ms (${results.length} results)`);

    // Step 5: Calculate composite scores and sort by weighted relevance
    const step5Start = Date.now();
    const maxFilterMatches = Math.max(...results.map(r => r.filterMatches), 0);
    const scoredResults = results.map((result, index) => 
      calculateResultScore(
        { ...result, rerankerScore: null, rerankerIndex: null },
        index,
        results.length,
        maxFilterMatches,
        refinementMode
      )
    );

    // Sort by score descending
    scoredResults.sort((a, b) => b.score - a.score);

    // Remove scoring metadata before returning (keep interface clean)
    finalResults = scoredResults.map(
      ({ score, scoreBreakdown, ...result }) => result
    );
    const step5Duration = Date.now() - step5Start;
    console.log(`[Search] Step 5 - Score calculation: ${step5Duration}ms`);
  } else if (refinementMode === 'reranker') {
    // Reranker only
    const step4Start = Date.now();
    const rerankedResults = await rerankSearchResults(
      qualityFilteredResults,
      naturalLanguageQuery,
      { topN: qualityFilteredResults.length }
    );
    const step4Duration = Date.now() - step4Start;
    console.log(`[Search] Step 4 - Reranker evaluation: ${step4Duration}ms (${rerankedResults.length} results)`);

    // Step 5: Calculate composite scores and sort by weighted relevance
    const step5Start = Date.now();
    const scoredResults = rerankedResults.map((result, index) => 
      calculateResultScore(
        { ...result, filterMatches: 0, filterAnswers: [] },
        index,
        rerankedResults.length,
        0,
        refinementMode
      )
    );

    // Sort by score descending
    scoredResults.sort((a, b) => b.score - a.score);

    // Remove scoring metadata before returning (keep interface clean)
    finalResults = scoredResults.map(
      ({ score, scoreBreakdown, ...result }) => result
    );
    const step5Duration = Date.now() - step5Start;
    console.log(`[Search] Step 5 - Score calculation: ${step5Duration}ms`);
  } else {
    // Both LLM and reranker
    const step4Start = Date.now();
    const [llmResults, rerankedResults] = await Promise.all([
      applyLLMFilters(qualityFilteredResults, filterQuestions),
      rerankSearchResults(qualityFilteredResults, naturalLanguageQuery, { topN: qualityFilteredResults.length })
    ]);
    const step4Duration = Date.now() - step4Start;
    console.log(`[Search] Step 4 - Parallel LLM + Reranker: ${step4Duration}ms`);

    // Merge LLM and reranker results
    const mergedResults: CombinedRefinedResult[] = llmResults.map((llmResult) => {
      const rerankerResult = rerankedResults.find(r => r.id === llmResult.id);
      return {
        ...llmResult,
        rerankerScore: rerankerResult?.rerankerScore ?? null,
        rerankerIndex: rerankerResult?.rerankerIndex ?? null,
      };
    });

    // Step 5: Calculate composite scores and sort by weighted relevance
    const step5Start = Date.now();
    const maxFilterMatches = Math.max(...mergedResults.map(r => r.filterMatches), 0);
    const scoredResults = mergedResults.map((result, index) => 
      calculateResultScore(result, index, mergedResults.length, maxFilterMatches, refinementMode)
    );

    // Sort by score descending
    scoredResults.sort((a, b) => b.score - a.score);

    // Remove scoring metadata before returning (keep interface clean)
    finalResults = scoredResults.map(
      ({ score, scoreBreakdown, ...result }) => result
    );
    const step5Duration = Date.now() - step5Start;
    console.log(`[Search] Step 5 - Score calculation: ${step5Duration}ms`);
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

