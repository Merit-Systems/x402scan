import { buildMetricsQuery } from "../query";

export const METRICS_BY_DOMAIN_QUERY = buildMetricsQuery(
  `/* extract domain name from url */
    replaceRegexpOne(url, '^https?://([^/]+).*', '\\1') AS origin`,
  "origin"
);