import { z } from 'zod';

import { log } from '@/shared/log';
import { safeFetch, safeParseResponse } from '@/shared/neverthrow/fetch';

import { mcpErrorJson, mcpSuccessJson } from './response';

import { fetchWellKnown } from './lib/fetch-well-known';

import type { RegisterTools } from '../types';

const toolName = 'discover_api_endpoints';

export const registerDiscoveryTools: RegisterTools = ({ server }) => {
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
      const wellKnownResult = await fetchWellKnown({
        surface: toolName,
        url,
      });

      if (wellKnownResult.isOk()) {
        return mcpSuccessJson(wellKnownResult.value);
      }

      const llmsTxtUrl = `${origin}/llms.txt`;
      log.debug(`Fetching llms.txt from: ${llmsTxtUrl}`);

      const llmsResult = await safeFetch(
        toolName,
        new Request(llmsTxtUrl, { headers: { Accept: 'text/plain' } })
      );

      if (llmsResult.isOk()) {
        const parseResult = await safeParseResponse(toolName, llmsResult.value);
        if (parseResult.isOk() && parseResult.value.type === 'text') {
          return mcpSuccessJson({
            document: 'llms.txt',
            body: parseResult.value.data,
          });
        }
      }

      return mcpErrorJson({
        message:
          'No discovery document found. Tried: .well-known/x402, DNS TXT record, llms.txt',
      });
    }
  );
};
