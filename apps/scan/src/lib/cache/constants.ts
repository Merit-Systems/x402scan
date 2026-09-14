/** Query freshness interval, matching the retained warming cron schedule. */
export const CACHE_DURATION_MINUTES = 15;

/** Native catalog cache lifetime; database query expiration belongs to Redis. */
export const QUERY_CACHE_LIFE = {
  stale: CACHE_DURATION_MINUTES * 60,
  revalidate: CACHE_DURATION_MINUTES * 60,
  expire: CACHE_DURATION_MINUTES * 60 * 2,
};
