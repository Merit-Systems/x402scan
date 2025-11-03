import { buildMetricsQuery } from "../query";

export const METRICS_BY_RESOURCE_QUERY = buildMetricsQuery("url AS resource", "url");