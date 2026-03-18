import type { GlobalFlags } from '@/types';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PrivateKeyAccount } from 'viem';

interface PromptProps {
  server: McpServer;
  account: PrivateKeyAccount;
  flags: GlobalFlags;
}

export type RegisterPrompts = (props: PromptProps) => void;
