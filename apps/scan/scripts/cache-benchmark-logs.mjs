import { readFile, writeFile } from "node:fs/promises";

const run = process.argv[2];
const source = process.argv[3];
if (!run || !source)
  throw new Error(
    "Usage: cache-benchmark-logs.mjs RUN_ID LOG_JSONL [OUTPUT_JSON]"
  );
const events = new Map();
for (const line of (await readFile(source, "utf8")).split("\n")) {
  if (!line.trim()) continue;
  let record;
  try {
    record = JSON.parse(line);
  } catch {
    continue;
  }
  for (const message of [
    record.message,
    ...(record.logs ?? []).map((log) => log.message),
  ]) {
    let event;
    try {
      event = JSON.parse(message);
    } catch {
      continue;
    }
    if (event?.benchmark !== "cache-v1" || event.run !== run) continue;
    // Vercel may repeat the same application log in multiple records.
    events.set(
      [
        event.executionId,
        event.event,
        event.attemptId ?? "",
        event.phase ?? "",
      ].join(":"),
      event
    );
  }
}
const summary = [];
for (const query of ["overall", "bucketed", "sellers", "recent-transfers"]) {
  for (const mode of ["next", "redis", "uncached"]) {
    const rows = [...events.values()].filter(
      (event) => event.query === query && event.mode === mode
    );
    if (!rows.length) continue;
    const starts = rows.filter((event) => event.event === "origin-start");
    const ends = rows.filter((event) => event.event === "origin-end");
    const attempts = rows.filter(
      (event) => event.event === "sql" && event.phase === "start"
    );
    const finished = rows.filter(
      (event) => event.event === "sql" && event.phase === "end"
    );
    summary.push({
      query,
      mode,
      originExecutions: starts.length,
      originCompletions: ends.length,
      originFailures: ends.filter((event) => !event.ok).length,
      queryAttempts: attempts.length,
      queryCompletions: finished.length,
      queryFailures: finished.filter((event) => !event.ok).length,
      queryDurationMs: finished.reduce(
        (sum, event) => sum + event.durationMs,
        0
      ),
    });
  }
}
const result = {
  run,
  caveat:
    "Counts cover only captured logs. Verify the log window/limit includes the full run. Prisma counts operations, not driver-internal statements. Missing completions can mean in-flight work or incomplete logs.",
  summary,
};
if (process.argv[4])
  await writeFile(process.argv[4], JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
