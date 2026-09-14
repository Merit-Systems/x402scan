import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { z } from "zod";

const deployment = z
  .string()
  .regex(/^dpl_[A-Za-z0-9]+$/)
  .parse(process.argv[2]);
const run = z.uuid().parse(process.argv[3]);
const output = process.argv[4] ?? "cache-benchmark-logs.jsonl";
const since = process.argv[5] ?? "30m";
const rows = new Map();
let until;
let complete = false;
for (let page = 0; page < 16; page++) {
  const args = [
    "logs",
    deployment,
    "--scope",
    "merit-systems",
    "--since",
    since,
    "--query",
    run,
    "--limit",
    "50",
    "--json",
  ];
  if (until !== undefined) args.push("--until", new Date(until).toISOString());
  const result = spawnSync("vercel", args, {
    encoding: "utf8",
    maxBuffer: 10000000,
  });
  if (result.status !== 0) throw new Error("Vercel log export failed");
  const batch = result.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const previousSize = rows.size;
  for (const row of batch) rows.set(row.id, row);
  // Preserve partial evidence if a subsequent page fails. These raw files are
  // local artifacts; the reducer publishes only benchmark measurement fields.
  await writeFile(
    output,
    [...rows.values()].map((row) => JSON.stringify(row)).join("\n")
  );
  console.log(
    JSON.stringify({ page, records: batch.length, totalUnique: rows.size })
  );
  if (batch.length === 0 || (batch.length < 50 && rows.size === previousSize)) {
    complete = true;
    break;
  }
  const next = Math.min(...batch.map((row) => row.timestamp));
  if (until !== undefined && next >= until)
    throw new Error("Log pagination made no progress; output is incomplete");
  until = next;
}
if (!complete)
  throw new Error(
    "Log export exceeded its page bound; output may be incomplete"
  );
