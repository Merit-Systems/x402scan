import { prisma } from '../client';

import type { Prisma } from '@prisma/client';

export const createResourceInvocation = async (
  data: Prisma.ResourceInvocationCreateInput
) => {
  console.log('Creating resource invocation', data);
  return await prisma.resourceInvocation.create({
    data,
  });
};
