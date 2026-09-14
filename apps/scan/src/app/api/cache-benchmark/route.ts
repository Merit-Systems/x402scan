import { env } from "@/env";

import { benchmarkAccess } from "./_lib/access";
import { benchmarkInput } from "./_lib/input";
import { runBenchmark } from "./_lib/run";

export const maxDuration = 60;

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (
    !benchmarkAccess(
      env.VERCEL_ENV,
      env.CACHE_BENCHMARK_TOKEN,
      request.headers.get("authorization")
    )
  ) {
    return Response.json({ error: "Not found" }, { status: 404, headers });
  }
  const input = benchmarkInput.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  if (!input.success)
    return Response.json(
      { error: "Invalid benchmark input" },
      { status: 400, headers }
    );
  if (input.data.mode === "redis" && (env.REDIS_DISABLE || !env.REDIS_URL)) {
    return Response.json(
      {
        error: env.REDIS_DISABLE
          ? "Redis is disabled for this preview"
          : "Redis is not configured for this preview",
      },
      { status: 503, headers }
    );
  }
  const started = performance.now();
  try {
    const { metadata: result } = await runBenchmark(input.data);
    return Response.json(
      {
        ...result,
        requestMs: performance.now() - started,
        computedAgeMs: Date.now() - result.completedAt,
        sourceAgeMs: result.sourceTimestamp
          ? Date.now() - Date.parse(result.sourceTimestamp)
          : null,
      },
      { headers }
    );
  } catch {
    return Response.json(
      { error: "Benchmark query failed" },
      { status: 503, headers }
    );
  }
}
