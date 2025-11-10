export interface ResourceAnalytics {
  totalCalls: number;
  avgDuration: number;
  successRate: number;
  sampleResponseBody: string | null;
}

export interface SearchResult {
  id: string;
  resource: string;
  type: string;
  x402Version: number;
  lastUpdated: Date;
  metadata: unknown;
  origin: {
    id: string;
    origin: string;
    title: string | null;
    description: string | null;
    favicon: string | null;
  };
  accepts: Array<{
    id: string;
    description: string;
    network: string;
    maxAmountRequired: string;
    asset: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  toolCallCount: number;
}

export interface EnrichedSearchResult extends SearchResult {
  analytics: ResourceAnalytics | null;
}

export interface FilterQuestion {
  question: string;
  index: number;
}

export interface FilteredSearchResult extends EnrichedSearchResult {
  filterMatches: number;
  filterAnswers: boolean[];
}

export interface RerankedSearchResult extends EnrichedSearchResult {
  rerankerScore: number | null;
  rerankerIndex: number | null;
}

export interface CombinedRefinedResult extends FilteredSearchResult {
  rerankerScore: number | null;
  rerankerIndex: number | null;
}

export type RefinementMode = 'none' | 'llm' | 'reranker' | 'both';

export type QueryMode = 'keywords' | 'sql' | 'sql-parallel';
