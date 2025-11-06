import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { prisma } from '@/services/db/client';
import { Prisma } from '@prisma/client';
import type { SearchResult } from './types';

export const sqlGenerationSchema = z.object({
  sqlQuery: z
    .string()
    .describe('The PostgreSQL WHERE clause (without the WHERE keyword)'),
  explanation: z
    .string()
    .describe('Brief explanation of what the query searches for'),
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

export const buildSearchPrompt = (
  naturalLanguageQuery: string,
  previousError?: { sql: string; error: string }
) => {
  const basePrompt = `You are an expert SQL query generator for a PostgreSQL database containing API resources.

Database Schema:
- Table: "Resources"
  - id (uuid)
  - resource (text) - The URL of the resource
  - type (enum) - Always 'http' 
  - x402Version (integer)
  - lastUpdated (timestamp)
  - metadata (jsonb) - Additional metadata about the resource
  - originId (uuid) - Foreign key to ResourceOrigin

- Table: "ResourceOrigin" (joined as 'origin')
  - id (uuid)
  - origin (text) - The origin/domain of the resource
  - title (text)
  - description (text)
  - favicon (text)

- Table: "Accepts" (joined as 'accepts')
  - id (uuid)
  - resourceId (uuid)
  - description (text) - Description of what the resource does
  - network (text) - Blockchain network
  - maxAmountRequired (bigint) - Maximum payment required
  - asset (text) - Payment asset required
  - payTo (text) - Payment address

- Table: "ResourcesTags" (many-to-many with Tag)
  - resourceId (uuid)
  - tagId (uuid)

- Table: "Tag"
  - id (uuid)
  - name (text) - Tag name like 'ai', 'data', 'image', etc.
  - color (text)

- Table: "ToolCall" (used to count how many times a resource has been called)
  - resourceId (uuid)

Natural Language Query: "${naturalLanguageQuery}"

Generate a PostgreSQL WHERE clause condition (without the WHERE keyword itself) that will filter the Resources table based on the natural language query above.

IMPORTANT RULES:
1. DO NOT include the "WHERE" keyword - just return the condition
2. Use table aliases: r for Resources, ro for ResourceOrigin
3. For searching in accepts descriptions, use: EXISTS (SELECT 1 FROM "Accepts" a WHERE a."resourceId" = r.id AND a.description ILIKE '%search_term%')
4. For searching by tags, use: EXISTS (SELECT 1 FROM "ResourcesTags" rt JOIN "Tag" t ON rt."tagId" = t.id WHERE rt."resourceId" = r.id AND t.name ILIKE '%tag_name%')
5. Use ILIKE for case-insensitive text searches
6. For resource URL searches, use: r.resource ILIKE '%search_term%'
7. For origin searches, use: ro.origin ILIKE '%search_term%' OR ro.title ILIKE '%search_term%'
8. NEVER return just "true" - ALWAYS extract at least 1-3 specific keywords from the query, even if it's broad
9. Use proper PostgreSQL syntax including double quotes for table/column names
10. The condition will be inserted directly after WHERE in: SELECT ... FROM "Resources" r LEFT JOIN "ResourceOrigin" ro ON r."originId" = ro.id WHERE <YOUR_CONDITION> ORDER BY ...
11. PREFER OR over AND when combining multiple search terms to return MORE results - use AND only when the query explicitly requires ALL conditions to match

Examples:
- "AI resources" → EXISTS (SELECT 1 FROM "ResourcesTags" rt JOIN "Tag" t ON rt."tagId" = t.id WHERE rt."resourceId" = r.id AND t.name ILIKE '%ai%')
- "resources from google.com" → ro.origin ILIKE '%google.com%'
- "image generation" → EXISTS (SELECT 1 FROM "Accepts" a WHERE a."resourceId" = r.id AND (a.description ILIKE '%image%' OR a.description ILIKE '%generation%'))
- "news from twitter about crypto" → (ro.origin ILIKE '%twitter%' OR ro.title ILIKE '%twitter%') OR (EXISTS (SELECT 1 FROM "Accepts" a WHERE a."resourceId" = r.id AND (a.description ILIKE '%news%' OR a.description ILIKE '%crypto%')))`;

  if (previousError) {
    return `${basePrompt}

PREVIOUS ATTEMPT FAILED:
The following SQL condition caused an error:
${previousError.sql}

Error: ${previousError.error}

Please generate a corrected WHERE clause condition that fixes this error. Make sure the syntax is valid PostgreSQL and follows all the rules above.

Generate the corrected WHERE clause condition:`;
  }

  return `${basePrompt}

Generate the WHERE clause condition:`;
};

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

  const maxRetries = 3;
  let lastError: { sql: string; error: string } | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await generateObject({
      model: openai('gpt-4.1-nano'),
      prompt: buildSearchPrompt(naturalLanguageQuery, lastError),
      schema: sqlGenerationSchema,
      temperature: 0.1,
    });

    if (attempt === 0) {
      console.log('Initial SQL generation:', result.object);
    } else {
      console.log(`SQL generation retry attempt ${attempt}:`, result.object);
    }

    if (!result.object) {
      throw new Error('Failed to generate SQL query');
    }

    const { sqlQuery, explanation } = result.object;

    const executionResult = await executeResourceSearch(sqlQuery);

    if (executionResult.success) {
      return {
        results: executionResult.results,
        explanation,
        totalCount: executionResult.results.length,
        sqlCondition: sqlQuery,
      };
    }

    // Execution failed, prepare for retry
    lastError = {
      sql: sqlQuery,
      error: executionResult.error,
    };
    console.log(
      `SQL execution failed (attempt ${attempt + 1}/${maxRetries}):`,
      executionResult.error
    );
  }

  // All retries exhausted
  throw new Error(
    `Failed to generate valid SQL after ${maxRetries} attempts. Last error: ${lastError?.error}`
  );
};

export async function executeResourceSearch(
  whereCondition: string
): Promise<
  { success: true; results: SearchResult[] } | { success: false; error: string }
> {
  // WARNING: This uses Prisma.raw for the WHERE condition, which is generated by AI.
  // This is acceptable because:
  // 1. This endpoint is admin-only
  // 2. The AI is instructed to generate safe SQL
  // 3. Results are validated against a schema

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

    const rawResults = await prisma.$queryRaw<unknown[]>(fullSql);
    const results = searchResultsSchema.parse(rawResults);
    return { success: true, results };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
