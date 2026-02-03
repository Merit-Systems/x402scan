import {
  successResponse,
  fromNeverthrowError,
  outputAndExit,
  type OutputFlags,
} from '@/cli/output';

import { submitErrorReport } from '@/shared/operations';
import { getWalletOrExit } from './lib';

import type { GlobalFlags } from '@/types';

const SURFACE = 'cli:report-error';

interface ReportErrorArgs {
  tool: string;
  summary: string;
  errorMessage: string;
  resource?: string;
  stack?: string;
  fullReport?: string;
}

export async function reportErrorCommand(
  args: ReportErrorArgs,
  flags: GlobalFlags<OutputFlags>
): Promise<void> {
  const { account } = await getWalletOrExit(flags);

  const result = await submitErrorReport(
    SURFACE,
    {
      tool: args.tool,
      summary: args.summary,
      errorMessage: args.errorMessage,
      resource: args.resource,
      stack: args.stack,
      fullReport: args.fullReport,
    },
    account.address,
    flags.dev
  );

  if (result.isErr()) {
    outputAndExit(fromNeverthrowError(result), flags);
  }

  outputAndExit(
    successResponse({
      submitted: result.value.submitted,
      reportId: result.value.reportId,
      message: result.value.message,
    }),
    flags
  );
}
