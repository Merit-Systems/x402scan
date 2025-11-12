import { scanDb } from '@repo/scan-db';

export const hasUserAcknowledgedComposer = async (
  userId: string
): Promise<boolean> => {
  const acknowledgement = await scanDb.userAcknowledgement.findUnique({
    where: { userId },
    select: { id: true },
  });
  return !!acknowledgement;
};

export const upsertUserAcknowledgement = async (userId: string) => {
  return await scanDb.userAcknowledgement.upsert({
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
