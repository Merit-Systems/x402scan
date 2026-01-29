import type { GlobalFlags } from '@/types';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PrivateKeyAccount } from 'viem';

interface PromptProps {
  server: McpServer;
}

export type RegisterPrompts = (props: PromptProps) => Promise<void> | void;

interface ResourceProps extends PromptProps {
  server: McpServer;
  flags: GlobalFlags;
}

export type RegisterResources = (props: ResourceProps) => Promise<void> | void;

interface ToolProps extends ResourceProps {
  account: PrivateKeyAccount;
  sessionId: string;
}

export type RegisterTools = (props: ToolProps) => Promise<void> | void;
