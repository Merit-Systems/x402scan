import { prisma } from './client';
import { z } from 'zod';

export const createResourceTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const createResourceTag = async (
  input: z.input<typeof createResourceTagSchema>
) => {
  const { name, color } = createResourceTagSchema.parse(input);
  return await prisma.tag.create({
    data: {
      name,
      color,
    },
  });
};

export const getAllResourceTags = async () => {
  return await prisma.tag.findMany({
    orderBy: {
      name: 'asc',
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
  resourceId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export const assignTagToResource = async (
  input: z.input<typeof assignTagToResourceSchema>
) => {
  const { resourceId, tagId } = assignTagToResourceSchema.parse(input);
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
  input: z.input<typeof assignTagToResourceSchema>
) => {
  const { resourceId, tagId } = assignTagToResourceSchema.parse(input);
  return await prisma.resourcesTags.delete({
    where: {
      resourceId_tagId: {
        resourceId,
        tagId,
      },
    },
  });
};

export const getResourceTags = async (resourceId: string) => {
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
