export type Metrics = {
  total_count_1h: number;
  total_count_6h: number;
  total_count_24h: number;
  total_count_3d: number;
  total_count_7d: number;
  total_count_15d: number;
  total_count_30d: number;
  total_count_all_time: number;
  uptime_1h_pct: number;
  uptime_6h_pct: number;
  uptime_24h_pct: number;
  uptime_3d_pct: number;
  uptime_7d_pct: number;
  uptime_15d_pct: number;
  uptime_30d_pct: number;
  uptime_all_time_pct: number;
  p50_1h_ms: number;
  p50_6h_ms: number;
  p50_24h_ms: number;
  p50_3d_ms: number;
  p50_7d_ms: number;
  p50_15d_ms: number;
  p50_30d_ms: number;
  p50_all_time_ms: number;
  p90_1h_ms: number;
  p90_6h_ms: number;
  p90_24h_ms: number;
  p90_3d_ms: number;
  p90_7d_ms: number;
  p90_15d_ms: number;
  p90_30d_ms: number;
  p90_all_time_ms: number;
  p99_1h_ms: number;
  p99_6h_ms: number;
  p99_24h_ms: number;
  p99_3d_ms: number;
  p99_7d_ms: number;
  p99_15d_ms: number;
  p99_30d_ms: number;
  p99_all_time_ms: number;
};

export type MetricsByUrl = Metrics & {
  url: string;
}

export type MetricsByDomain = Metrics & {
  domain: string;
}