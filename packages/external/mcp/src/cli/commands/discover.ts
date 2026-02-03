import {
  successResponse,
  errorResponse,
  outputAndExit,
  type OutputFlags,
} from '@/cli/output';

import { discoverResources } from '@/shared/operations';

import type { GlobalFlags } from '@/types';

interface DiscoverArgs {
  url: string;
}

export async function discoverCommand(
  args: DiscoverArgs,
  flags: GlobalFlags<OutputFlags>
): Promise<void> {
  const result = await discoverResources('cli:discover', args.url);

  if (result.isOk()) {
    outputAndExit(
      successResponse({
        found: true,
        origin: result.value.origin,
        source: result.value.source,
        ...(result.value.usage ? { usage: result.value.usage } : {}),
        data: result.value.data,
      }),
      flags
    );
  }

  // Error case
  outputAndExit(
    errorResponse({
      code: 'GENERAL_ERROR',
      message: result.error.message,
      surface: result.error.surface,
      cause: result.error.cause,
      details: { origin: result.error.origin },
    }),
    flags
  );
}
