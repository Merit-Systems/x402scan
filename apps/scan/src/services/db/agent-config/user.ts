import { prisma } from '../client';

export const listUserAgentConfigurations = async (userId: string) => {
  return await prisma.agentConfigurationUser.findMany({
    where: {
      userId,
    },
    include: {
      agentConfiguration: true,
    },
    orderBy: { chats: { _count: 'desc' } },
  });
};

export const joinAgentConfiguration = async (
  userId: string,
  agentConfigurationId: string
) => {
  const agentConfiguration = await prisma.agentConfiguration.findUnique({
    where: { id: agentConfigurationId },
  });
  if (!agentConfiguration) {
    throw new Error('Agent configuration not found');
  }
  if (
    agentConfiguration.visibility === 'private' &&
    agentConfiguration.ownerId !== userId
  ) {
    throw new Error('You are not authorized to join this agent configuration');
  }
  return await prisma.agentConfigurationUser.create({
    data: {
      userId,
      agentConfigurationId,
    },
  });
};

export const leaveAgentConfiguration = async (
  userId: string,
  agentConfigurationId: string
) => {
  return await prisma.agentConfigurationUser.delete({
    where: { userId_agentConfigurationId: { userId, agentConfigurationId } },
  });
};
