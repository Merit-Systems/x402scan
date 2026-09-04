import { env } from "@/env";
import { z } from "zod";
import type { SearchResult, RerankedSearchResult } from "./types";

const jinaRerankerResponseSchema = z.object({
  model: z.string(),
  usage: z.object({
    total_tokens: z.number(),
    prompt_tokens: z.number(),
  }),
  results: z.array(
    z.object({
      index: z.number(),
      document: z.object({ text: z.string() }).optional(),
      relevance_score: z.number(),
    })
  ),
});

/**
 * Builds a text representation of a resource for reranking
 */
function buildResourceText(resource: SearchResult): string {
  const parts = [
    resource.origin.title ?? resource.origin.origin,
    resource.accepts.find((accept) => accept.description)?.description ?? "",
    resource.origin.description ?? "",
    resource.tags.map((t) => t.name).join(", "),
  ].filter(Boolean);

  return parts.join(" | ");
}

/**
 * Reranks search results using Jina AI's reranker API
 */
export async function rerankSearchResults(
  results: SearchResult[],
  naturalLanguageQuery: string,
  options?: {
    topN?: number;
    returnDocuments?: boolean;
  }
): Promise<RerankedSearchResult[]> {
  if (!env.JINA_API_KEY) {
    console.warn("[Reranker] JINA_API_KEY not configured, skipping reranking");
    return results.map((r) => ({
      ...r,
      rerankerScore: null,
      rerankerIndex: null,
    }));
  }

  if (results.length === 0) {
    return [];
  }

  const topN = options?.topN ?? results.length;
  const returnDocuments = options?.returnDocuments ?? false;

  // Build documents array from results
  const documents = results.map(buildResourceText);

  const requestBody = {
    model: "jina-reranker-v2-base-multilingual",
    query: naturalLanguageQuery,
    top_n: Math.min(topN, results.length),
    documents,
    return_documents: returnDocuments,
  };

  const startTime = Date.now();

  const response = await fetch("https://api.jina.ai/v1/rerank", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.JINA_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Reranker] API error:", response.status, errorText);
    throw new Error(
      `Jina reranker API error: ${String(response.status)} ${errorText}`
    );
  }

  const data = jinaRerankerResponseSchema.parse(await response.json());
  const duration = Date.now() - startTime;

  console.log(
    `[Reranker] Reranked ${String(results.length)} results in ${String(duration)}ms (top ${String(data.results.length)})`
  );

  // Create a map of original index to reranker data
  const rerankerMap = new Map<number, { score: number; newIndex: number }>();
  data.results.forEach((result, newIndex) => {
    rerankerMap.set(result.index, {
      score: result.relevance_score,
      newIndex,
    });
  });

  // Enrich results with reranker scores
  const rerankedResults: RerankedSearchResult[] = results.map(
    (result, index) => {
      const rerankerData = rerankerMap.get(index);
      return {
        ...result,
        rerankerScore: rerankerData?.score ?? null,
        rerankerIndex: rerankerData?.newIndex ?? null,
      };
    }
  );

  // Sort by reranker score (highest first), then put unranked items at the end
  return rerankedResults.toSorted((a, b) => {
    // Items with reranker scores come first
    if (a.rerankerScore !== null && b.rerankerScore === null) return -1;
    if (a.rerankerScore === null && b.rerankerScore !== null) return 1;

    // Both have scores - sort by score descending
    if (a.rerankerScore !== null && b.rerankerScore !== null) {
      return b.rerankerScore - a.rerankerScore;
    }

    // Both are unranked - maintain original order
    return 0;
  });
}
