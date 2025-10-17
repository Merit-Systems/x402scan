import { prisma } from './client';
import { z } from 'zod';

export const createResourceRequestMetadataSchema = z.object({
  resourceId: z.uuid(),
  headers: z.record(z.string(), z.any()),
  body: z.record(z.string(), z.any()),
  queryParams: z.record(z.string(), z.any()),
  inputSchema: z.record(z.string(), z.any()),
});

export const updateResourceRequestMetadataSchema = z.object({
  id: z.uuid(),
  headers: z.record(z.string(), z.any()).optional(),
  body: z.record(z.string(), z.any()).optional(),
  queryParams: z.record(z.string(), z.any()).optional(),
  inputSchema: z.record(z.string(), z.any()).optional(),
});

export const createResourceRequestMetadata = async (
  input: z.input<typeof createResourceRequestMetadataSchema>
) => {
  const data = createResourceRequestMetadataSchema.parse(input);
  return await prisma.resourceRequestMetadata.create({
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

export const updateResourceRequestMetadata = async (
  input: z.input<typeof updateResourceRequestMetadataSchema>
) => {
  const { id, ...updateData } =
    updateResourceRequestMetadataSchema.parse(input);
  return await prisma.resourceRequestMetadata.update({
    where: { id },
    data: updateData,
    include: {
      resource: {
        include: {
          origin: true,
        },
      },
    },
  });
};

export const getResourceRequestMetadata = async (resourceId: string) => {
  return await prisma.resourceRequestMetadata.findUnique({
    where: { resourceId },
    include: {
      resource: {
        include: {
          origin: true,
        },
      },
    },
  });
};

export const getAllResourceRequestMetadata = async () => {
  return await prisma.resourceRequestMetadata.findMany({
    include: {
      resource: {
        include: {
          origin: true,
        },
      },
    },
    orderBy: {
      resource: {
        resource: 'asc',
      },
    },
  });
};

export const deleteResourceRequestMetadata = async (id: string) => {
  return await prisma.resourceRequestMetadata.delete({
    where: { id },
  });
};

export const searchResourcesForMetadata = async (search?: string) => {
  return await prisma.resources.findMany({
    where: {
      ...(search
        ? {
            OR: [
              {
                resource: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                origin: {
                  origin: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                metadata: {
                  path: ['title'],
                  string_contains: search,
                },
              },
            ],
          }
        : undefined),
    },
    include: {
      origin: true,
      requestMetadata: true,
      _count: {
        select: {
          invocations: true,
        },
      },
    },
    take: 50,
    orderBy: [{ invocations: { _count: 'desc' } }, { resource: 'asc' }],
  });
};
