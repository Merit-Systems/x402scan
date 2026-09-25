export interface BitqueryUsageResponse {
  account_id: number;
  payer_id: number;
  status: "active" | "grace" | "blocked" | "expired";
  billing_period: {
    started_at: string;
    ended_at: string;
    plan_name: string;
    limits: {
      points_limit: number;
      mcp_points_limit: number;
    };
    usage: {
      points_usage: number;
      mcp_points_usage: number;
    };
  };
}
