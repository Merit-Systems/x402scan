import type { GlobalFlags } from '@/types';

/**
 * Start the MCP server
 * This is a wrapper that imports and calls the existing server implementation
 */
export async function serverCommand(flags: GlobalFlags): Promise<void> {
  const { startServer } = await import('@/server');
  await startServer(flags);
}
