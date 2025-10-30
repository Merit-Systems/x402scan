export const UPTIME_QUERY = `
SELECT
    url,

    COUNTIf(created_at >= now() - toIntervalHour(24)) AS total_count_24h,

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
        (COUNTIf(status_code BETWEEN 200 AND 299) + COUNTIf(status_code >= 500)) = 0,
        NULL,
        100.0 * COUNTIf(status_code BETWEEN 200 AND 299)
        / (COUNTIf(status_code BETWEEN 200 AND 299) + COUNTIf(status_code >= 500))
    ), 2) AS uptime_all_time_pct,

    /* latency percentiles from duration (ms) */
    quantileTimingIf(0.50)(duration, created_at >= now() - toIntervalHour(1))  AS p50_1h_ms,
    quantileTimingIf(0.90)(duration, created_at >= now() - toIntervalHour(1))  AS p90_1h_ms,
    quantileTimingIf(0.99)(duration, created_at >= now() - toIntervalHour(1))  AS p99_1h_ms,

    quantileTimingIf(0.50)(duration, created_at >= now() - toIntervalHour(6))  AS p50_6h_ms,
    quantileTimingIf(0.90)(duration, created_at >= now() - toIntervalHour(6))  AS p90_6h_ms,
    quantileTimingIf(0.99)(duration, created_at >= now() - toIntervalHour(6))  AS p99_6h_ms,

    quantileTimingIf(0.50)(duration, created_at >= now() - toIntervalHour(24)) AS p50_24h_ms,
    quantileTimingIf(0.90)(duration, created_at >= now() - toIntervalHour(24)) AS p90_24h_ms,
    quantileTimingIf(0.99)(duration, created_at >= now() - toIntervalHour(24)) AS p99_24h_ms,

    /* all time */
    quantileTiming(0.50)(duration) AS p50_all_time_ms,
    quantileTiming(0.90)(duration) AS p90_all_time_ms,
    quantileTiming(0.99)(duration) AS p99_all_time_ms

FROM resource_invocations
GROUP BY url
ORDER BY total_count_24h DESC, url ASC;
`;
