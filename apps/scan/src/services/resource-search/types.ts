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
  accepts: {
    id: string;
    description: string;
    network: string;
    maxAmountRequired: string;
    asset: string;
  }[];
  tags: {
    id: string;
    name: string;
    color: string;
  }[];
  toolCallCount: number;
}

export type EnrichedSearchResult = {
  analytics: ResourceAnalytics | null;
} & SearchResult;

export interface FilterQuestion {
  question: string;
  index: number;
}

export type FilteredSearchResult = {
  filterMatches: number;
  filterAnswers: boolean[];
} & EnrichedSearchResult;

export type RerankedSearchResult = {
  rerankerScore: number | null;
  rerankerIndex: number | null;
} & EnrichedSearchResult;

export type CombinedRefinedResult = {
  rerankerScore: number | null;
  rerankerIndex: number | null;
} & FilteredSearchResult;

export type RefinementMode = 'none' | 'llm' | 'reranker' | 'both';

export type QueryMode = 'keywords' | 'sql' | 'sql-parallel';
