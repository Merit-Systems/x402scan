import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { z } from "zod";

import { benchmarkEnv } from "./env/cache-benchmark.mjs";

const target = new URL(process.argv[2] ?? "http://localhost:3000");
if (target.protocol !== "https:" && target.hostname !== "localhost") {
  throw new Error("HTTPS required except for localhost");
}
if (
  target.hostname !== "localhost" &&
  !target.hostname.endsWith(".vercel.app")
) {
  throw new Error("Only localhost or a Vercel preview hostname is permitted");
}
const run = benchmarkEnv.BENCHMARK_RUN_ID ?? randomUUID();
const token = benchmarkEnv.CACHE_BENCHMARK_TOKEN;
const dryRun = process.argv.includes("--dry-run");
const output = benchmarkEnv.BENCHMARK_OUTPUT ?? "cache-benchmark-results.json";
const queries = ["overall", "bucketed", "sellers", "recent-transfers"];
// Rotate order to reduce systematic first-mode advantage. This is still a
// small smoke test, not a randomized production load study.
const modes = ["uncached", "redis", "next"];
const records = [];
if (!dryRun && !token) throw new Error("CACHE_BENCHMARK_TOKEN is required");
if (dryRun) {
  console.log(
    JSON.stringify({
      target: target.origin,
      run,
      queries,
      modes,
      requests: 300,
      maxConcurrency: 20,
    })
  );
} else {
  async function request(query, mode, phase) {
    const url = new URL("/api/cache-benchmark", target);
    url.search = new URLSearchParams({ run, query, mode }).toString();
    const start = performance.now();
    try {
      const response = await fetch(url, {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(65000),
        redirect: "error",
      });
      const data = await response.json();
      const row = {
        query,
        mode,
        phase,
        status: response.status,
        elapsedMs: performance.now() - start,
        requestId: response.headers.get("x-vercel-id"),
        ...data,
      };
      records.push(row);
      return (
        response.ok &&
        z.object({ executionId: z.uuid() }).safeParse(data).success
      );
    } catch (error) {
      records.push({
        query,
        mode,
        phase,
        status: 0,
        elapsedMs: performance.now() - start,
        error: error instanceof Error ? error.message : "Request failed",
      });
      return false;
    }
  }
  let failed = false;
  for (const [index, query] of queries.entries()) {
    for (let offset = 0; offset < modes.length; offset++) {
      const mode = modes[(index + offset) % modes.length];
      // Fresh run IDs produce isolated cold keys. Reusing a run is useful for
      // refresh/expiration tests; then "initial-burst" is not necessarily cold.
      const success = await Promise.all(
        Array.from({ length: 20 }, () => request(query, mode, "initial-burst"))
      );
      if (success.some((ok) => !ok)) {
        failed = true;
        break;
      }
      for (let n = 0; n < 5; n++) {
        if (!(await request(query, mode, "warm-serial"))) {
          failed = true;
          break;
        }
      }
      console.log(
        JSON.stringify({
          query,
          mode,
          completed: records.filter(
            (row) => row.query === query && row.mode === mode
          ).length,
        })
      );
      if (failed) break;
    }
    if (failed) break;
  }
  const summary = [];
  for (const query of queries)
    for (const mode of modes)
      for (const phase of ["initial-burst", "warm-serial"]) {
        const rows = records.filter(
          (row) =>
            row.query === query && row.mode === mode && row.phase === phase
        );
        if (!rows.length) continue;
        const times = rows.map((row) => row.elapsedMs).sort((a, b) => a - b);
        summary.push({
          query,
          mode,
          phase,
          requests: rows.length,
          errors: rows.filter((row) => row.status !== 200).length,
          medianMs: times[Math.ceil(times.length / 2) - 1],
          p95Ms: times[Math.ceil(times.length * 0.95) - 1],
          observedExecutionIds: [
            ...new Set(rows.map((row) => row.executionId).filter(Boolean)),
          ],
        });
      }
  await writeFile(
    output,
    JSON.stringify(
      {
        run,
        target: target.origin,
        completedAt: new Date().toISOString(),
        failed,
        caveat:
          "Response execution IDs are a lower bound; correlate all origin-start and sql/start events in deployment logs to count unreturned duplicate work. Age of cached computation is distinct from materialized-view freshness.",
        summary,
        records,
      },
      null,
      2
    )
  );
  console.log(JSON.stringify(summary, null, 2));
  if (failed) process.exitCode = 1;
}
