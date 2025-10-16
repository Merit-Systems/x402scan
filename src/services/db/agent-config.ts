import type { Prisma } from '@prisma/client';
import { prisma } from './client';

// AgentConfiguration CRUD operations
export const createAgentConfiguration = async (data: Prisma.AgentConfigurationCreateInput) => {
  return await prisma.agentConfiguration.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const getAgentConfigurationById = async (id: string) => {
  return await prisma.agentConfiguration.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const getAgentConfigurationsByUserId = async (userId: string) => {
  return await prisma.agentConfiguration.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const updateAgentConfiguration = async (id: string, data: Prisma.AgentConfigurationUpdateInput) => {
  return await prisma.agentConfiguration.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const deleteAgentConfiguration = async (id: string) => {
  return await prisma.agentConfiguration.delete({
    where: { id },
  });
};

// Additional utility functions
export const getPublicAgentConfigurations = async () => {
  return await prisma.agentConfiguration.findMany({
    where: { visibility: 'public' },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const getAgentConfigurationsByUserIdAndVisibility = async (
  userId: string,
  visibility: 'public' | 'private'
) => {
  return await prisma.agentConfiguration.findMany({
    where: { 
      userId,
      visibility 
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};
