import { buildMetricsQuery } from '../query';

// extract origin name
export const METRICS_BY_DOMAIN_QUERY = buildMetricsQuery(
  `replaceRegexpOne(url, '^https?://([^/]+).*', '\\1') AS origin`,
  'origin'
);
