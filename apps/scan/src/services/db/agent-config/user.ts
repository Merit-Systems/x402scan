import { scanDb } from "@x402scan/scan-db";

export const listUserAgentConfigurations = async (userId: string) => {
  return await scanDb.agentConfigurationUser.findMany({
    where: {
      userId,
    },
    include: {
      agentConfiguration: true,
    },
    orderBy: { chats: { _count: "desc" } },
  });
};
