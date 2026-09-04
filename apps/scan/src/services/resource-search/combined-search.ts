import type {
  CombinedRefinedResult,
  FilterQuestion,
  RefinementMode,
  QueryMode,
} from "./types";
import { searchResourcesWithNaturalLanguage as searchWithKeywords } from "./database-tags-search";
import { searchResourcesWithNaturalLanguage as searchWithSQL } from "./database-search";
import { searchResourcesWithNaturalLanguage as searchWithSQLParallel } from "./database-search-parallel-retry";
import { generateFilterQuestions, applyLLMFilters } from "./llm-refined-search";
import { rerankSearchResults } from "./reranker-search";
import { z } from "zod";

/**
 * Performs a combined search that:
 * 1. DB search with optional parallel filter question generation
 * 2. Applies selected refinement method(s): LLM filters, reranker, both, or none
 * 3. Returns results in the order provided by the LLM/reranker
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
  const refinementMode = options?.refinementMode ?? "none";
  const queryMode = options?.queryMode ?? "keywords";

  const useLlmFilter = refinementMode === "llm" || refinementMode === "both";

  // Select the appropriate search function based on queryMode
  const searchFunction =
    queryMode === "sql"
      ? searchWithSQL
      : queryMode === "sql-parallel"
        ? searchWithSQLParallel
        : searchWithKeywords;

  // Step 1: DB search and optionally parallelize with filter question generation
  const step1Start = Date.now();
  let dbResults;
  let filterQuestions: FilterQuestion[] = [];
  let filterExplanation =
    refinementMode === "none"
      ? "No refinement applied"
      : `Refinement mode: ${refinementMode}`;

  if (useLlmFilter) {
    try {
      [
        dbResults,
        { questions: filterQuestions, explanation: filterExplanation },
      ] = await Promise.all([
        searchFunction(naturalLanguageQuery),
        generateFilterQuestions(naturalLanguageQuery),
      ]);
      console.log(
        `[Search] Step 1 - Parallel DB search (${queryMode}) + filter generation: ${String(Date.now() - step1Start)}ms (${String(dbResults.results.length)} results, ${String(filterQuestions.length)} questions)`
      );
    } catch (error) {
      console.error(
        "[Search] Error in parallel DB search + filter generation:",
        error
      );
      // Fallback: try DB search without filter generation
      dbResults = await searchFunction(naturalLanguageQuery);
      filterQuestions = [];
      filterExplanation =
        "Filter generation failed, continuing without filters";
      console.log(
        `[Search] Step 1 - DB search (${queryMode}) only (fallback): ${String(Date.now() - step1Start)}ms (${String(dbResults.results.length)} results)`
      );
    }
  } else {
    dbResults = await searchFunction(naturalLanguageQuery);
    console.log(
      `[Search] Step 1 - DB search (${queryMode}) only: ${String(Date.now() - step1Start)}ms (${String(dbResults.results.length)} results)`
    );
  }

  const searchResults = dbResults.results;

  let finalResults: CombinedRefinedResult[];

  if (refinementMode === "none") {
    finalResults = searchResults.map((r) => ({
      ...r,
      filterMatches: 0,
      filterAnswers: [],
      rerankerScore: null,
      rerankerIndex: null,
    }));
    console.log(`[Search] Step 2 - Skipped (no refinement)`);
  } else if (refinementMode === "llm") {
    const step2Start = Date.now();
    try {
      const results = await applyLLMFilters(searchResults, filterQuestions);
      console.log(
        `[Search] Step 2 - LLM filter: ${String(Date.now() - step2Start)}ms (${String(results.length)} results)`
      );

      finalResults = results.map((r) => ({
        ...r,
        rerankerScore: null,
        rerankerIndex: null,
      }));
    } catch (error) {
      console.error(
        "[Search] LLM filter failed, returning unfiltered results:",
        error
      );
      finalResults = searchResults.map((r) => ({
        ...r,
        filterMatches: 0,
        filterAnswers: [],
        rerankerScore: null,
        rerankerIndex: null,
      }));
    }
  } else if (refinementMode === "reranker") {
    const step2Start = Date.now();
    try {
      const results = await rerankSearchResults(
        searchResults,
        naturalLanguageQuery
      );
      console.log(
        `[Search] Step 2 - Reranker: ${String(Date.now() - step2Start)}ms (${String(results.length)} results)`
      );

      finalResults = results.map((r) => ({
        ...r,
        filterMatches: 0,
        filterAnswers: [],
      }));
    } catch (error) {
      console.error(
        "[Search] Reranker failed, returning unranked results:",
        error
      );
      finalResults = searchResults.map((r) => ({
        ...r,
        filterMatches: 0,
        filterAnswers: [],
        rerankerScore: null,
        rerankerIndex: null,
      }));
    }
  } else {
    // Both LLM and reranker - use reranker for final ordering
    const step2Start = Date.now();
    try {
      const [llmResults, rerankedResults] = await Promise.all([
        applyLLMFilters(searchResults, filterQuestions),
        rerankSearchResults(searchResults, naturalLanguageQuery),
      ]);
      console.log(
        `[Search] Step 2 - Parallel LLM + Reranker: ${String(Date.now() - step2Start)}ms`
      );

      // Use reranker order, but include LLM filter data
      finalResults = rerankedResults.map((rerankedResult) => {
        const llmResult = llmResults.find((r) => r.id === rerankedResult.id);
        return {
          ...rerankedResult,
          filterMatches: llmResult?.filterMatches ?? 0,
          filterAnswers: llmResult?.filterAnswers ?? [],
        };
      });
    } catch (error) {
      console.error(
        "[Search] LLM + Reranker failed, returning unrefined results:",
        error
      );
      finalResults = searchResults.map((r) => ({
        ...r,
        filterMatches: 0,
        filterAnswers: [],
        rerankerScore: null,
        rerankerIndex: null,
      }));
    }
  }

  const totalDuration = Date.now() - startTime;
  console.log(`[Search] Total duration: ${String(totalDuration)}ms`);

  return {
    results: finalResults,
    explanation: dbResults.explanation,
    totalCount: dbResults.totalCount,
    sqlCondition: dbResults.sqlCondition,
    keywords: z
      .array(z.string())
      .catch([])
      .parse("keywords" in dbResults ? dbResults.keywords : []),
    filterQuestions,
    filterExplanation,
  };
}
