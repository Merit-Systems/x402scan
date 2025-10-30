// Per-URL total count and uptime percentages (1h / 6h / 24h / all-time)
// Definition: uptime = 100 * 2xx / (2xx + 5xx), ignoring 4xx
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
    ), 2) AS uptime_all_time_pct

FROM resource_invocations
GROUP BY url
ORDER BY total_count_24h DESC, url ASC;
`;
