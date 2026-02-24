/**
 * Global CLI context for shared state that needs to be accessed
 * across modules without passing through every function parameter.
 *
 * Set once at CLI startup, read anywhere.
 */

interface CliContext {
  verbose: boolean;
}

const context: CliContext = {
  verbose: false,
};

/**
 * Configure CLI context (call once at startup)
 */
export function configureCliContext(options: Partial<CliContext>): void {
  if (options.verbose !== undefined) {
    context.verbose = options.verbose;
  }
}

/**
 * Check if verbose/debug mode is enabled
 * Checks both CLI context and X402_DEBUG env var
 */
export function isVerbose(): boolean {
  return context.verbose || process.env.X402_DEBUG === 'true';
}
