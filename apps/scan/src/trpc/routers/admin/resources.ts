import z from "zod";

import { adminProcedure, createTRPCRouter } from "../../trpc";

import {
  createTag,
  createTagSchema,
  assignTagToResource,
  unassignTagFromResource,
  assignTagToResourceSchema,
  unassignAllTagsFromResource,
  unassignAllTagsFromAllResources,
  deleteResourceTag,
  removeSubTagsFromTag,
  unassignAllSubTags,
} from "@/services/db/resources/tag";
import {
  createResourceRequestMetadata,
  createResourceRequestMetadataSchema,
  updateResourceRequestMetadata,
  updateResourceRequestMetadataSchema,
  getAllResourceRequestMetadata,
  deleteResourceRequestMetadata,
  searchResourcesForMetadata,
} from "@/services/db/resources/request-metadata";
import {
  createExcludedResource,
  createExcludedResourceSchema,
  getAllExcludedResources,
  deleteExcludedResourceByResourceId,
  searchResourcesForExcludes,
} from "@/services/db/resources/excludes";
import {
  getBucketedResourceCreations,
  getBucketedToolCalls,
  getBucketedToolCallsByTags,
  getBucketedToolCallsByResources,
  resourceBucketedQuerySchema,
} from "@/services/db/resources/stats";
import { searchResourcesCombined } from "@/services/resource-search/combined-search";

const refinementModeSchema = z.enum(["none", "llm", "reranker", "both"]);
const queryModeSchema = z.enum(["keywords", "sql", "sql-parallel"]);

export const adminResourcesRouter = createTRPCRouter({
  search: adminProcedure
    .input(
      z.object({
        query: z.string(),
        refinementMode: refinementModeSchema.optional().default("none"),
        queryMode: queryModeSchema.optional().default("keywords"),
      })
    )
    .query(async ({ input }) => {
      return searchResourcesCombined(input.query, {
        refinementMode: input.refinementMode,
        queryMode: input.queryMode,
      });
    }),

  tags: {
    create: adminProcedure
      .input(createTagSchema)
      .mutation(async ({ input }) => {
        return createTag(input);
      }),

    assign: adminProcedure
      .input(assignTagToResourceSchema)
      .mutation(async ({ input }) => {
        return assignTagToResource(input);
      }),

    unassign: adminProcedure
      .input(assignTagToResourceSchema)
      .mutation(async ({ input }) => {
        return unassignTagFromResource(input);
      }),

    unassignAll: adminProcedure.input(z.uuid()).mutation(async ({ input }) => {
      return unassignAllTagsFromResource(input);
    }),

    unassignAllFromAll: adminProcedure.mutation(async () => {
      return unassignAllTagsFromAllResources();
    }),

    delete: adminProcedure.input(z.uuid()).mutation(async ({ input }) => {
      return deleteResourceTag(input);
    }),

    removeSubTags: adminProcedure
      .input(z.uuid())
      .mutation(async ({ input }) => {
        return removeSubTagsFromTag(input);
      }),

    unassignAllSubTags: adminProcedure.mutation(async () => {
      return unassignAllSubTags();
    }),
  },
  requestMetadata: {
    list: adminProcedure.query(async () => {
      return getAllResourceRequestMetadata();
    }),

    searchResources: adminProcedure
      .input(z.object({ search: z.string().optional() }))
      .query(async ({ input }) => {
        return searchResourcesForMetadata(input.search);
      }),

    create: adminProcedure
      .input(createResourceRequestMetadataSchema)
      .mutation(async ({ input }) => {
        return createResourceRequestMetadata(input);
      }),

    update: adminProcedure
      .input(updateResourceRequestMetadataSchema)
      .mutation(async ({ input }) => {
        return updateResourceRequestMetadata(input);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.uuid() }))
      .mutation(async ({ input }) => {
        return deleteResourceRequestMetadata(input.id);
      }),
  },
  excludes: {
    list: adminProcedure.query(async () => {
      return getAllExcludedResources();
    }),

    searchResources: adminProcedure
      .input(z.object({ search: z.string().optional() }))
      .query(async ({ input }) => {
        return searchResourcesForExcludes(input.search);
      }),

    create: adminProcedure
      .input(createExcludedResourceSchema)
      .mutation(async ({ input }) => {
        return createExcludedResource(input);
      }),

    deleteByResourceId: adminProcedure
      .input(z.object({ resourceId: z.uuid() }))
      .mutation(async ({ input }) => {
        return deleteExcludedResourceByResourceId(input.resourceId);
      }),
  },
  stats: {
    creations: adminProcedure
      .input(resourceBucketedQuerySchema)
      .query(async ({ input }) => {
        return getBucketedResourceCreations(input);
      }),

    toolCalls: adminProcedure
      .input(resourceBucketedQuerySchema)
      .query(async ({ input }) => {
        return getBucketedToolCalls(input);
      }),

    toolCallsByTags: adminProcedure
      .input(resourceBucketedQuerySchema)
      .query(async ({ input }) => {
        return getBucketedToolCallsByTags(input);
      }),

    toolCallsByResources: adminProcedure
      .input(resourceBucketedQuerySchema)
      .query(async ({ input }) => {
        return getBucketedToolCallsByResources(input);
      }),
  },
});
