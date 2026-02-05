/**
 * Known x402-protected API origins.
 * Using const enum so values are inlined at build time.
 */
export const enum Origin {
  EnrichX402 = 'https://enrichx402.com',
  StableStudio = 'https://stablestudio.io',
}

/**
 * Array of all known origins for iteration.
 * Const enums are erased at compile time, so we need a regular array for runtime iteration.
 */
export const ORIGINS = [Origin.EnrichX402, Origin.StableStudio] as const;
