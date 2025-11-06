import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { prisma } from '@/services/db/client';
import { Prisma } from '@prisma/client';
import type { SearchResult } from './types';

const keywordExpansionSchema = z.object({
  keywords: z
    .array(z.string())
    .min(1)
    .describe(
      'Array of expanded search keywords including the original term, synonyms, and related terms. MUST contain at least 1 keyword.'
    ),
  explanation: z.string().describe('Brief explanation of the search terms'),
});

const searchResultSchema = z.object({
  id: z.string(),
  resource: z.string(),
  type: z.string(),
  x402Version: z.number(),
  lastUpdated: z.date(),
  metadata: z.any().nullable(),
  origin: z.object({
    id: z.string(),
    origin: z.string(),
    title: z.string().nullable(),
    description: z.string().nullable(),
    favicon: z.string().nullable(),
  }),
  accepts: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      network: z.string(),
      maxAmountRequired: z.string(),
      asset: z.string(),
    })
  ),
  tags: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
    })
  ),
  toolCallCount: z.number(),
});

const searchResultsSchema = z.array(searchResultSchema);

const buildKeywordExpansionPrompt = (naturalLanguageQuery: string) => {
  return `You are a search keyword expansion expert. Your job is to take a search query and expand it with related terms, synonyms, and variations to improve search results.

User's Search Query: "${naturalLanguageQuery}"

Generate an array of expanded keywords that includes:
1. The original search term(s) - BREAK DOWN multi-word queries into individual words
2. Synonyms and alternative words
3. Related single words or very short terms (max 2 words)
4. Common abbreviations or full forms
5. Broader and narrower terms

IMPORTANT: 
- Prefer INDIVIDUAL WORDS over long phrases. Each keyword should be a single word or very short term that can match independently.
- You MUST return at least 1-3 keywords. NEVER return an empty array, even for very broad queries.
- Extract the most relevant specific terms from the query.

Examples:
- "T-shirt" → ["shirt", "tee", "top", "clothing", "apparel", "tshirt", "wear", "garment"]
- "image generation" → ["image", "picture", "photo", "graphic", "visual", "generation", "generate", "create", "render", "draw", "illustration"]
- "AI" → ["AI", "artificial", "intelligence", "machine", "learning", "ML", "neural", "network", "deep", "model"]
- "payment API" → ["payment", "pay", "transaction", "purchase", "billing", "API", "endpoint", "service"]
- "Twitter news" → ["Twitter", "news", "tweet", "post", "updates", "feed", "social", "media", "headlines", "stories"]
- "news from twitter about crypto" → ["news", "Twitter", "crypto", "cryptocurrency", "bitcoin", "blockchain", "updates", "feed", "tweet", "social"]

Generate 5-10 relevant single words or very short terms. Focus on individual words that can match flexibly. Even for very broad queries, extract the core terms.`;
};

function buildSearchCondition(keywords: string[]): string {
  // This should never happen due to schema validation, but fail safely
  if (keywords.length === 0) {
    throw new Error(
      'No keywords extracted from query. The AI must provide at least one keyword.'
    );
  }

  // Escape single quotes in keywords for SQL safety
  const sanitizedKeywords = keywords.map(k => k.replace(/'/g, "''"));

  // Build OR conditions for each keyword across all searchable fields
  const keywordConditions = sanitizedKeywords.map(keyword => {
    const pattern = `%${keyword}%`;
    return `(
      r.resource ILIKE '${pattern}'
      OR ro.origin ILIKE '${pattern}'
      OR ro.title ILIKE '${pattern}'
      OR ro.description ILIKE '${pattern}'
      OR EXISTS (
        SELECT 1 FROM "Accepts" a 
        WHERE a."resourceId" = r.id 
        AND a.description ILIKE '${pattern}'
      )
      OR EXISTS (
        SELECT 1 FROM "ResourcesTags" rt 
        JOIN "Tag" t ON rt."tagId" = t.id 
        WHERE rt."resourceId" = r.id 
        AND t.name ILIKE '${pattern}'
      )
    )`;
  });

  // Join all keyword conditions with OR (resource matches if ANY keyword matches)
  return keywordConditions.join(' OR ');
}

export const searchResourcesWithNaturalLanguage = async (
  naturalLanguageQuery: string
): Promise<{
  results: SearchResult[];
  explanation: string;
  totalCount: number;
  sqlCondition: string;
  keywords: string[];
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
      keywords: [],
    };
  }

  // Generate expanded keywords using LLM
  const result = await generateObject({
    model: openai('gpt-4.1-nano'),
    prompt: buildKeywordExpansionPrompt(naturalLanguageQuery),
    schema: keywordExpansionSchema,
    temperature: 0.3,
  });

  if (!result.object) {
    throw new Error('Failed to generate keywords');
  }

  const { keywords, explanation } = result.object;
  console.log('Expanded keywords:', keywords);

  // Build SQL programmatically using the keywords
  const sqlCondition = buildSearchCondition(keywords);
  console.log('Generated SQL condition:', sqlCondition);

  const executionResult = await executeResourceSearch(sqlCondition);

  if (!executionResult.success) {
    throw new Error(`Search execution failed: ${executionResult.error}`);
  }

  return {
    results: executionResult.results,
    explanation,
    totalCount: executionResult.results.length,
    sqlCondition,
    keywords,
  };
};

async function executeResourceSearch(
  whereCondition: string
): Promise<
  { success: true; results: SearchResult[] } | { success: false; error: string }
> {
  // Note: The WHERE condition is built programmatically with sanitized keywords.
  // Keywords are generated by AI but sanitized (single quotes escaped) before SQL construction.
  // This endpoint is admin-only and results are validated against a schema.

  try {
    const sql = Prisma.sql`
      SELECT 
        r.id,
        r.resource,
        r.type,
        r."x402Version",
        r."lastUpdated",
        r.metadata,
        -- Origin data as nested JSON object
        json_build_object(
          'id', ro.id,
          'origin', ro.origin,
          'title', ro.title,
          'description', ro.description,
          'favicon', ro.favicon
        ) as origin,
        -- Accepts data as JSON array
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'description', a.description,
                'network', a.network,
                'maxAmountRequired', a."maxAmountRequired"::text,
                'asset', a.asset
              )
            )
            FROM "Accepts" a 
            WHERE a."resourceId" = r.id
          ),
          '[]'::json
        ) as accepts,
        -- Tags data as JSON array
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', t.id,
                'name', t.name,
                'color', t.color
              )
            )
            FROM "ResourcesTags" rt
            JOIN "Tag" t ON rt."tagId" = t.id
            WHERE rt."resourceId" = r.id
          ),
          '[]'::json
        ) as tags,
        -- Tool call count
        (
          SELECT COUNT(*)::int
          FROM "ToolCall" tc
          WHERE tc."resourceId" = r.id
        ) as "toolCallCount"
      FROM "Resources" r
      LEFT JOIN "ResourceOrigin" ro ON r."originId" = ro.id
      WHERE `;

    // Append the WHERE condition and the rest of the query
    const fullSql = Prisma.join(
      [
        sql,
        Prisma.raw(whereCondition),
        Prisma.raw(' ORDER BY r."lastUpdated" DESC LIMIT 100'),
      ],
      ''
    );

    const rawResults = await prisma.$queryRaw<any[]>(fullSql);
    const results = searchResultsSchema.parse(rawResults);
    return { success: true, results };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
