import { prisma } from '../client';

export const hasUserAcknowledgedComposer = async (
  userId: string
): Promise<boolean> => {
  const acknowledgement = await prisma.userAcknowledgement.findUnique({
    where: { userId },
    select: { id: true },
  });
  return !!acknowledgement;
};

export const upsertUserAcknowledgement = async (userId: string) => {
  return await prisma.userAcknowledgement.upsert({
    where: { userId },
    create: {
      userId,
      acknowledgedComposerAt: new Date(),
    },
    update: {
      acknowledgedComposerAt: new Date(),
    },
  });
};
