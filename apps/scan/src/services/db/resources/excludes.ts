import { scanDb } from "@x402scan/scan-db";
import { z } from "zod";

export const createExcludedResourceSchema = z.object({
  resourceId: z.uuid(),
});

export const createExcludedResource = async (
  input: z.input<typeof createExcludedResourceSchema>
) => {
  const data = createExcludedResourceSchema.parse(input);
  return scanDb.excludedResource.create({
    data,
    include: {
      resource: {
        include: {
          origin: true,
        },
      },
    },
  });
};

export const getAllExcludedResources = async () => {
  return scanDb.excludedResource.findMany({
    include: {
      resource: {
        include: {
          origin: true,
          _count: {
            select: {
              invocations: true,
            },
          },
        },
      },
    },
    orderBy: {
      resource: {
        resource: "asc",
      },
    },
  });
};

export const deleteExcludedResourceByResourceId = async (
  resourceId: string
) => {
  return scanDb.excludedResource.delete({
    where: { resourceId },
  });
};

export const searchResourcesForExcludes = async (search?: string) => {
  return scanDb.resources.findMany({
    where: {
      ...(search
        ? {
            OR: [
              {
                resource: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                origin: {
                  origin: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                metadata: {
                  path: ["title"],
                  string_contains: search,
                },
              },
            ],
          }
        : undefined),
    },
    include: {
      origin: true,
      excluded: true,
      _count: {
        select: {
          invocations: true,
        },
      },
    },
    take: 50,
    orderBy: [{ invocations: { _count: "desc" } }, { resource: "asc" }],
  });
};
