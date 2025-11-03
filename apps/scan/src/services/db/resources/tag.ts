import { prisma } from '@/services/db/client';
import { z } from 'zod';
import { MAIN_TAGS } from '@/services/labeling/main-tags';

export const createTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const createTag = async (data: z.infer<typeof createTagSchema>) => {
  return await prisma.tag.create({
    data,
  });
};

export const listTagsSchema = z.object({
  filterTags: z.array(z.string()).default([]),
});

export const listTags = async (data: z.infer<typeof listTagsSchema>) => {
  return await prisma.tag.findMany({
    orderBy: {
      name: 'asc',
    },
    where: {
      name: {
        notIn: data.filterTags,
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

export const removeSubTagsFromTag = async (tagId: string) => {
  // Find all resources that have this tag
  const resourcesWithTag = await prisma.resourcesTags.findMany({
    where: {
      tagId,
    },
    select: {
      resourceId: true,
    },
  });

  const resourceIds = resourcesWithTag.map(rt => rt.resourceId);

  // Delete all tag associations from these resources EXCEPT for the specified tag
  return await prisma.resourcesTags.deleteMany({
    where: {
      resourceId: {
        in: resourceIds,
      },
      tagId: {
        not: tagId,
      },
    },
  });
};

export const unassignAllSubTags = async () => {
  const mainTagNames = Object.keys(MAIN_TAGS);

  // Delete all tags (and their assignments via cascade) that are NOT main categories
  return await prisma.tag.deleteMany({
    where: {
      name: {
        notIn: mainTagNames,
      },
    },
  });
};
