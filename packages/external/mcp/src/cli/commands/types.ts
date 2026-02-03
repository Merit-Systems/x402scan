import type { GlobalFlags } from '@/types';
import type { OutputFlags } from '@/cli/output';

/**
 * Extended flags for CLI commands
 */
export type CliFlags = GlobalFlags<OutputFlags>;

/**
 * Command handler type for CLI commands
 */
export type CliCommand<T extends object = object> = (
  args: T,
  flags: CliFlags
) => Promise<void>;
