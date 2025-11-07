/**
 * Cache configuration constants.
 * This file contains no dependencies and can be safely imported in both client and server components.
 *
 * Global cache duration in minutes.
 * This should match the interval used for date rounding to prevent cache fragmentation.
 * IMPORTANT: This value must match the cron schedule in vercel.json (/api/cron/warm-cache)
 */
export const CACHE_DURATION_MINUTES = 20;
