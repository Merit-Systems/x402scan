import { NextResponse, NextRequest } from 'next/server';
import { checkCronSecret } from '@/lib/cron';
import { listResourcesWithPagination } from '@/services/db/resources/resource';
import {
  validateAndRefineSubcategories,
  SUBCATEGORIES,
} from '@/services/labeling/sub-label';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/services/db/client';
import { z } from 'zod';
import { v4 } from 'uuid';
import type { MainTag } from '@/services/labeling/main-tags';
import { createTag } from '@/services/db/resources/tag';

const validateSubcategoriesPayloadSchema = z.object({
  mainCategory: z.enum([
    'Search',
    'AI',
    'Crypto',
    'Trading',
    'Utility',
    'Random',
  ]),
  createTags: z.boolean().default(false), // Whether to create the subcategory tags in DB
});

export const POST = async (request: NextRequest) => {
  const cronCheck = checkCronSecret(request);
  if (cronCheck) {
    return cronCheck;
  }

  const sessionId = v4();
  const startTime = Date.now();

  try {
    const body = await request.json();
    const payload = validateSubcategoriesPayloadSchema.parse(body);

    console.info('Starting subcategory assignment', {
      mainCategory: payload.mainCategory,
      createTags: payload.createTags,
      sessionId,
    });

    // Fetch all resources with the main category tag
    const where: Prisma.ResourcesWhereInput = {
      tags: {
        some: {
          tag: {
            name: payload.mainCategory,
          },
        },
      },
    };

    const allResources = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { items, hasNextPage } = await listResourcesWithPagination(
        { page, page_size: 100 },
        where
      );

      allResources.push(...items);
      hasMore = hasNextPage;
      page++;
    }

    console.info(
      `Fetched ${allResources.length} resources for ${payload.mainCategory}`
    );

    if (allResources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `No resources found with main category tag: ${payload.mainCategory}`,
        },
        { status: 400 }
      );
    }

    // Get subcategories from the constant
    const subcategories = SUBCATEGORIES[payload.mainCategory as MainTag];
    if (!subcategories) {
      return NextResponse.json(
        {
          success: false,
          message: `No subcategories defined for ${payload.mainCategory}`,
        },
        { status: 400 }
      );
    }

    console.info('Assigning resources to subcategories...');
    const result = await validateAndRefineSubcategories(
      payload.mainCategory,
      [...subcategories],
      allResources,
      sessionId
    );

    // Optionally create tags in the database
    let createdTags: Array<{ name: string; id: string }> = [];
    if (payload.createTags) {
      console.info('Creating subcategory tags in database...');

      for (const subcatName of result.subcategories) {
        const existing = await prisma.tag.findFirst({
          where: { name: subcatName },
        });

        if (!existing) {
          const newTag = await createTag({
            name: subcatName,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          });
          createdTags.push({ name: newTag.name, id: newTag.id });
        }
      }

      console.info(`Created ${createdTags.length} new tags`);
    }

    const durationMs = Date.now() - startTime;

    console.info('Subcategory assignment completed', {
      mainCategory: payload.mainCategory,
      qualityScore: result.qualityScore,
      durationMs,
      sessionId,
    });

    // Prepare distribution summary
    const distribution = result.distributionMetrics.metrics.map(m => ({
      subcategory: m.subcategory,
      count: m.count,
      percentage: parseFloat(m.percentage.toFixed(1)),
      isEmpty: m.isEmpty,
      isDominating: m.isDominating,
      isUnderutilized: m.isUnderutilized,
    }));

    // Prepare overlap summary
    const topConflicts = Array.from(
      result.overlapMetrics.pairConflicts.entries()
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pair, count]) => ({
        pair: pair.split('|'),
        conflicts: count,
      }));

    return NextResponse.json(
      {
        success: true,
        message: 'Subcategory assignment completed',
        mainCategory: payload.mainCategory,
        sessionId,
        durationMs,
        result: {
          subcategories: result.subcategories,
          qualityScore: parseFloat(result.qualityScore.toFixed(1)),
          metrics: {
            gini: parseFloat(result.distributionMetrics.gini.toFixed(3)),
            ambiguityRate: parseFloat(
              (result.overlapMetrics.ambiguityRate * 100).toFixed(1)
            ),
            avgConfidenceGap: parseFloat(
              result.overlapMetrics.avgConfidenceGap.toFixed(3)
            ),
            emptyCategories: result.distributionMetrics.emptyCategories,
            dominatingCategories:
              result.distributionMetrics.dominatingCategories,
            underutilizedCategories:
              result.distributionMetrics.underutilizedCategories,
          },
          distribution,
          topConflicts,
        },
        createdTags: payload.createTags ? createdTags : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subcategory validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId,
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Subcategory validation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      },
      { status: 500 }
    );
  }
};

// Also support GET for simpler testing
export const GET = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const mainCategory = searchParams.get('mainCategory');
  const createTags = searchParams.get('createTags') === 'true';

  if (!mainCategory) {
    return NextResponse.json(
      {
        success: false,
        message: 'mainCategory query parameter is required',
      },
      { status: 400 }
    );
  }

  // Convert GET to POST by creating a Request with the body
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      mainCategory,
      createTags,
    }),
  });

  return POST(mockRequest);
};
