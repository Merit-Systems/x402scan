import { prisma } from '@/services/db/client';
import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const createTag = async (data: z.infer<typeof createTagSchema>) => {
  return await prisma.tag.create({
    data,
  });
};

export const listTags = async () => {
  return await prisma.tag.findMany({
    orderBy: {
      name: 'asc',
    },
    where: {
      name: {
        not: 'Crypto',
      },
    },
    include: {
      _count: {
        select: {
          resourcesTags: true,
        },
      },
    },
  });
};

export const assignTagToResourceSchema = z.object({
  resourceId: z.uuid(),
  tagId: z.uuid(),
});

export const assignTagToResource = async (
  data: z.infer<typeof assignTagToResourceSchema>
) => {
  const { resourceId, tagId } = data;
  return await prisma.resourcesTags.upsert({
    where: {
      resourceId_tagId: {
        resourceId,
        tagId,
      },
    },
    create: {
      resourceId,
      tagId,
    },
    update: {
      assignedAt: new Date(),
    },
  });
};

export const unassignTagFromResource = async (
  data: z.infer<typeof assignTagToResourceSchema>
) => {
  const { resourceId, tagId } = data;
  return await prisma.resourcesTags.delete({
    where: {
      resourceId_tagId: {
        resourceId,
        tagId,
      },
    },
  });
};

export const listResourceTags = async (resourceId: string) => {
  return await prisma.resourcesTags.findMany({
    where: {
      resourceId,
    },
    include: {
      tag: true,
    },
    orderBy: {
      tag: {
        name: 'asc',
      },
    },
  });
};

export const unassignAllTagsFromResource = async (resourceId: string) => {
  return await prisma.resourcesTags.deleteMany({
    where: {
      resourceId,
    },
  });
};

export const unassignAllTagsFromAllResources = async () => {
  return await prisma.resourcesTags.deleteMany({});
};

export const deleteResourceTag = async (tagId: string) => {
  return await prisma.tag.delete({
    where: {
      id: tagId,
    },
    include: {
      resourcesTags: true,
    },
  });
};
