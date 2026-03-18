import type { GlobalFlags } from '@/types';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

interface RegisterResourcesProps {
  server: McpServer;
  flags: GlobalFlags;
}

export type RegisterResources = (
  props: RegisterResourcesProps
) => Promise<void> | void;
