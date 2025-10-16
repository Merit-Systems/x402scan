import { publicProcedure, createTRPCRouter } from '../trpc';
import { generateX402Tools } from '@/services/agent/get-tools';

export const availableToolsRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    const tools = await generateX402Tools();

    return tools.map(tool => {
      const urlParts = new URL(tool.resource);
      const toolName = urlParts.pathname
        .split('/')
        .filter(Boolean)
        .join('_')
        .replace(/[^a-zA-Z0-9_]/g, '_');

      return {
        name: toolName,
        description: tool.description,
        resource: tool.resource,
        network: tool.network,
        maxAmountRequired: tool.maxAmountRequired,
      };
    });
  }),
});
