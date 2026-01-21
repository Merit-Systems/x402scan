import type { GlobalFlags } from '@/types';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PrivateKeyAccount } from 'viem';

interface RegisterToolsProps {
  server: McpServer;
  account: PrivateKeyAccount;
  flags: GlobalFlags;
}

export type RegisterTools = (props: RegisterToolsProps) => void;

export enum FetchStates {
  INITIAL_REQUEST = 'initial_request',
  PAYMENT_REQUIRED = 'payment_required',
  PAYMENT_CREATED = 'payment_created',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_SETTLED = 'payment_settled',
}
