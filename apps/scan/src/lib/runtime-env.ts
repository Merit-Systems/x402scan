/**
 * Runtime environment detection for isomorphic modules.
 *
 * Property-presence checks instead of `typeof window` guards: the environment
 * is decided once here, and call sites branch on a plain boolean. Do not use
 * these to gate server-only imports — unlike `typeof window`, bundlers cannot
 * dead-code-eliminate branches on these values.
 */
export const isBrowser = "window" in globalThis;
export const isServer = !isBrowser;
