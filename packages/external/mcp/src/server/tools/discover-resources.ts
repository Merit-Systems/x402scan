import { z } from 'zod';

import { discoverResources } from '@/shared/operations';
import { mcpErrorJson, mcpSuccessJson } from './response';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const toolName = 'discover_api_endpoints';

export function registerDiscoveryTools(server: McpServer): void {
  server.registerTool(
    toolName,
    {
      title: 'Discover API Endpoints',
      description: `Find x402-protected resources on an origin. Returns a list of resource URLs.
        Use check_x402_endpoint separately to get detailed pricing/schema info for specific resources.
        Known default origins with resource packs. Discover if more needed:
        - https://enrichx402.com ->
            People + Org search
            Google Maps (places + locations)
            Grok twitter search
            Exa web search
            Clado linkedin data
            Firecrawl web scrape
            WhitePages (business directory)
            Email enrichment
        - https://stablestudio.io -> generate and edit images / videos
        `,
      inputSchema: z.object({
        url: z
          .url()
          .describe(
            'The origin URL or any URL on the origin to discover resources from'
          ),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ url }) => {
      const result = await discoverResources(toolName, url);

      if (result.isOk()) {
        return mcpSuccessJson({
          found: true,
          origin: result.value.origin,
          source: result.value.source,
          ...(result.value.usage ? { usage: result.value.usage } : {}),
          data: result.value.data,
        });
      }

      return mcpErrorJson({
        found: false,
        origin: result.error.origin,
        error: result.error.message,
      });
    }
  );
}
