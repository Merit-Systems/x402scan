export function buildMetricsQuery(
  selectExpression: string,
  groupByField: string
): string {
  return `
  SELECT
      ${selectExpression},
  
  /* total counts */
  COUNTIf(created_at >= now() - toIntervalHour(1))    AS total_count_1h,
  COUNTIf(created_at >= now() - toIntervalHour(6))    AS total_count_6h,
  COUNTIf(created_at >= now() - toIntervalHour(24))   AS total_count_24h,
  COUNTIf(created_at >= now() - toIntervalDay(3))     AS total_count_3d,
  COUNTIf(created_at >= now() - toIntervalDay(7))     AS total_count_7d,
  COUNTIf(created_at >= now() - toIntervalDay(15))    AS total_count_15d,
  COUNTIf(created_at >= now() - toIntervalDay(30))    AS total_count_30d,
  COUNT(*)                                            AS total_count_all_time,

  /* per-status-class counts */
  /* 1h */
  COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalHour(1)) AS count_2xx_1h,
  COUNTIf(status_code BETWEEN 300 AND 399 AND created_at >= now() - toIntervalHour(1)) AS count_3xx_1h,
  COUNTIf(status_code BETWEEN 400 AND 499 AND created_at >= now() - toIntervalHour(1)) AS count_4xx_1h,
  COUNTIf(status_code BETWEEN 500 AND 599 AND created_at >= now() - toIntervalHour(1)) AS count_5xx_1h,

  /* 6h */
  COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalHour(6)) AS count_2xx_6h,
  COUNTIf(status_code BETWEEN 300 AND 399 AND created_at >= now() - toIntervalHour(6)) AS count_3xx_6h,
  COUNTIf(status_code BETWEEN 400 AND 499 AND created_at >= now() - toIntervalHour(6)) AS count_4xx_6h,
  COUNTIf(status_code BETWEEN 500 AND 599 AND created_at >= now() - toIntervalHour(6)) AS count_5xx_6h,

  /* 24h */
  COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalHour(24)) AS count_2xx_24h,
  COUNTIf(status_code BETWEEN 300 AND 399 AND created_at >= now() - toIntervalHour(24)) AS count_3xx_24h,
  COUNTIf(status_code BETWEEN 400 AND 499 AND created_at >= now() - toIntervalHour(24)) AS count_4xx_24h,
  COUNTIf(status_code BETWEEN 500 AND 599 AND created_at >= now() - toIntervalHour(24)) AS count_5xx_24h,

  /* 3d */
  COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(3)) AS count_2xx_3d,
  COUNTIf(status_code BETWEEN 300 AND 399 AND created_at >= now() - toIntervalDay(3)) AS count_3xx_3d,
  COUNTIf(status_code BETWEEN 400 AND 499 AND created_at >= now() - toIntervalDay(3)) AS count_4xx_3d,
  COUNTIf(status_code BETWEEN 500 AND 599 AND created_at >= now() - toIntervalDay(3)) AS count_5xx_3d,

  /* 7d */
  COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(7)) AS count_2xx_7d,
  COUNTIf(status_code BETWEEN 300 AND 399 AND created_at >= now() - toIntervalDay(7)) AS count_3xx_7d,
  COUNTIf(status_code BETWEEN 400 AND 499 AND created_at >= now() - toIntervalDay(7)) AS count_4xx_7d,
  COUNTIf(status_code BETWEEN 500 AND 599 AND created_at >= now() - toIntervalDay(7)) AS count_5xx_7d,

   /* 15d */
   COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(15)) AS count_2xx_15d,
   COUNTIf(status_code BETWEEN 300 AND 399 AND created_at >= now() - toIntervalDay(15)) AS count_3xx_15d,
   COUNTIf(status_code BETWEEN 400 AND 499 AND created_at >= now() - toIntervalDay(15)) AS count_4xx_15d,
   COUNTIf(status_code BETWEEN 500 AND 599 AND created_at >= now() - toIntervalDay(15)) AS count_5xx_15d,

   /* 30d */
   COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(30)) AS count_2xx_30d,
   COUNTIf(status_code BETWEEN 300 AND 399 AND created_at >= now() - toIntervalDay(30)) AS count_3xx_30d,
   COUNTIf(status_code BETWEEN 400 AND 499 AND created_at >= now() - toIntervalDay(30)) AS count_4xx_30d,
   COUNTIf(status_code BETWEEN 500 AND 599 AND created_at >= now() - toIntervalDay(30)) AS count_5xx_30d,

   /* all time */
   COUNTIf(status_code BETWEEN 200 AND 299) AS count_2xx_all_time,
   COUNTIf(status_code BETWEEN 300 AND 399) AS count_3xx_all_time,
   COUNTIf(status_code BETWEEN 400 AND 499) AS count_4xx_all_time,
   COUNTIf(status_code BETWEEN 500 AND 599) AS count_5xx_all_time,

  /* uptime percentages */
  round(if(
      (COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalHour(1))
     + COUNTIf(status_code >= 500 AND created_at >= now() - toIntervalHour(1))) = 0,
      NULL,
      100.0 * COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalHour(1))
      / (COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalHour(1))
       + COUNTIf(status_code >= 500 AND created_at >= now() - toIntervalHour(1)))
  ), 2) AS uptime_1h_pct,

  round(if(
      (COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalHour(6))
     + COUNTIf(status_code >= 500 AND created_at >= now() - toIntervalHour(6))) = 0,
      NULL,
      100.0 * COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalHour(6))
      / (COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalHour(6))
       + COUNTIf(status_code >= 500 AND created_at >= now() - toIntervalHour(6)))
  ), 2) AS uptime_6h_pct,

  round(if(
      (COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalHour(24))
     + COUNTIf(status_code >= 500 AND created_at >= now() - toIntervalHour(24))) = 0,
      NULL,
      100.0 * COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalHour(24))
      / (COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalHour(24))
       + COUNTIf(status_code >= 500 AND created_at >= now() - toIntervalHour(24)))
  ), 2) AS uptime_24h_pct,

  round(if(
      (COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(3))
     + COUNTIf(status_code >= 500 AND created_at >= now() - toIntervalDay(3))) = 0,
      NULL,
      100.0 * COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(3))
      / (COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(3))
       + COUNTIf(status_code >= 500 AND created_at >= now() - toIntervalDay(3)))
  ), 2) AS uptime_3d_pct,

  round(if(
      (COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(7))
     + COUNTIf(status_code >= 500 AND created_at >= now() - toIntervalDay(7))) = 0,
      NULL,
      100.0 * COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(7))
      / (COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(7))
       + COUNTIf(status_code >= 500 AND created_at >= now() - toIntervalDay(7)))
  ), 2) AS uptime_7d_pct,

  round(if(
      (COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(15))
     + COUNTIf(status_code >= 500 AND created_at >= now() - toIntervalDay(15))) = 0,
      NULL,
      100.0 * COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(15))
      / (COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(15))
       + COUNTIf(status_code >= 500 AND created_at >= now() - toIntervalDay(15)))
  ), 2) AS uptime_15d_pct,

  round(if(
      (COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(30))
     + COUNTIf(status_code >= 500 AND created_at >= now() - toIntervalDay(30))) = 0,
      NULL,
      100.0 * COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(30))
      / (COUNTIf(status_code BETWEEN 200 AND 299 AND created_at >= now() - toIntervalDay(30))
       + COUNTIf(status_code >= 500 AND created_at >= now() - toIntervalDay(30)))
  ), 2) AS uptime_30d_pct,

  round(if(
      (COUNTIf(status_code BETWEEN 200 AND 299) + COUNTIf(status_code >= 500)) = 0,
      NULL,
      100.0 * COUNTIf(status_code BETWEEN 200 AND 299)
      / (COUNTIf(status_code BETWEEN 200 AND 299) + COUNTIf(status_code >= 500))
  ), 2) AS uptime_all_time_pct,

  /* latency percentiles (ms) */
  quantileTimingIf(0.50)(duration, created_at >= now() - toIntervalHour(1))   AS p50_1h_ms,
  quantileTimingIf(0.90)(duration, created_at >= now() - toIntervalHour(1))   AS p90_1h_ms,
  quantileTimingIf(0.99)(duration, created_at >= now() - toIntervalHour(1))   AS p99_1h_ms,

  quantileTimingIf(0.50)(duration, created_at >= now() - toIntervalHour(6))   AS p50_6h_ms,
  quantileTimingIf(0.90)(duration, created_at >= now() - toIntervalHour(6))   AS p90_6h_ms,
  quantileTimingIf(0.99)(duration, created_at >= now() - toIntervalHour(6))   AS p99_6h_ms,

  quantileTimingIf(0.50)(duration, created_at >= now() - toIntervalHour(24))  AS p50_24h_ms,
  quantileTimingIf(0.90)(duration, created_at >= now() - toIntervalHour(24))  AS p90_24h_ms,
  quantileTimingIf(0.99)(duration, created_at >= now() - toIntervalHour(24))  AS p99_24h_ms,

  quantileTimingIf(0.50)(duration, created_at >= now() - toIntervalDay(3))    AS p50_3d_ms,
  quantileTimingIf(0.90)(duration, created_at >= now() - toIntervalDay(3))    AS p90_3d_ms,
  quantileTimingIf(0.99)(duration, created_at >= now() - toIntervalDay(3))    AS p99_3d_ms,

  quantileTimingIf(0.50)(duration, created_at >= now() - toIntervalDay(7))    AS p50_7d_ms,
  quantileTimingIf(0.90)(duration, created_at >= now() - toIntervalDay(7))    AS p90_7d_ms,
  quantileTimingIf(0.99)(duration, created_at >= now() - toIntervalDay(7))    AS p99_7d_ms,

  quantileTimingIf(0.50)(duration, created_at >= now() - toIntervalDay(15))   AS p50_15d_ms,
  quantileTimingIf(0.90)(duration, created_at >= now() - toIntervalDay(15))   AS p90_15d_ms,
  quantileTimingIf(0.99)(duration, created_at >= now() - toIntervalDay(15))   AS p99_15d_ms,

  quantileTimingIf(0.50)(duration, created_at >= now() - toIntervalDay(30))   AS p50_30d_ms,
  quantileTimingIf(0.90)(duration, created_at >= now() - toIntervalDay(30))   AS p90_30d_ms,
  quantileTimingIf(0.99)(duration, created_at >= now() - toIntervalDay(30))   AS p99_30d_ms,

  quantileTiming(0.50)(duration) AS p50_all_ms,
  quantileTiming(0.90)(duration) AS p90_all_ms,
  quantileTiming(0.99)(duration) AS p99_all_ms

  
  FROM resource_invocations
  GROUP BY ${groupByField}
  ORDER BY total_count_24h DESC, ${groupByField} ASC;
  `;
}
