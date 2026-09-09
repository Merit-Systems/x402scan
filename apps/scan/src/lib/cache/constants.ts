/** Query freshness interval, matching the retained warming cron schedule. */
export const CACHE_DURATION_MINUTES = 15;

/** Shared query freshness: refresh after 15 minutes, block after 30 minutes. */
export const QUERY_CACHE_LIFE = {
  stale: CACHE_DURATION_MINUTES * 60,
  revalidate: CACHE_DURATION_MINUTES * 60,
  expire: CACHE_DURATION_MINUTES * 60 * 2,
};
