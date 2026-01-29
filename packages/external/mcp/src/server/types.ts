import type { GlobalFlags } from '@/types';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PrivateKeyAccount } from 'viem';

interface ToolProps {
  server: McpServer;
  account: PrivateKeyAccount;
  flags: GlobalFlags;
  sessionId: string;
}

export type RegisterTools = (props: ToolProps) => void | Promise<void>;
