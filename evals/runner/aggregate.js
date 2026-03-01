#!/usr/bin/env node
/**
 * aggregate.js - Aggregate trial scores into summary.json and recommendations.md
 *
 * Usage: node runner/aggregate.js [results-subdir]
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { summarize } from "./score.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RESULTS_SUBDIR = process.argv[2] || "results";
const TRIALS_DIR = join(ROOT, RESULTS_SUBDIR, "trials");
const RESULTS_DIR = join(ROOT, RESULTS_SUBDIR);

// Collect all trial scores
const trials = [];
const trialDirs = readdirSync(TRIALS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const dir of trialDirs) {
  const scorePath = join(TRIALS_DIR, dir, "score.json");
  if (existsSync(scorePath)) {
    try {
      const score = JSON.parse(readFileSync(scorePath, "utf8"));
      trials.push(score);
    } catch (e) {
      console.error(`Failed to read ${scorePath}: ${e.message}`);
    }
  }
}

if (trials.length === 0) {
  console.error("No trial scores found.");
  process.exit(1);
}

console.log(`Found ${trials.length} trial scores.`);

const summary = summarize(trials);

writeFileSync(
  join(RESULTS_DIR, "summary.json"),
  JSON.stringify(summary, null, 2)
);
console.log(`Summary written to ${RESULTS_SUBDIR}/summary.json`);

// Generate recommendations.md
const lines = [];
lines.push("# Discovery Copy-for-Agents Eval: Results");
lines.push("");
lines.push(`**Date:** ${new Date().toISOString().split("T")[0]}`);
lines.push(`**Trials:** ${summary.overall.total}`);
lines.push(`**Overall Pass Rate:** ${summary.overall.passRate}`);
lines.push(
  `**Median Completion Time:** ${summary.overall.medianCompletionTimeMs}ms`
);
lines.push("");

lines.push("## Results by Fixture");
lines.push("");
lines.push("| Fixture | Pass | Fail | Rate |");
lines.push("|---------|------|------|------|");
for (const [name, data] of Object.entries(summary.byFixture)) {
  lines.push(`| ${name} | ${data.passes} | ${data.fails} | ${data.passRate} |`);
}
lines.push("");

lines.push("## Failure Analysis");
lines.push("");
if (summary.topFailureBuckets.length > 0) {
  lines.push("| Bucket | Count |");
  lines.push("|--------|-------|");
  for (const { bucket, count } of summary.topFailureBuckets) {
    lines.push(`| ${bucket} | ${count} |`);
  }
  lines.push("");
} else {
  lines.push("No failures recorded.");
  lines.push("");
}

// Verdict
lines.push("## Verdict");
lines.push("");
const passRate = parseInt(summary.overall.passRate);
if (passRate >= 80) {
  lines.push(
    `**Copy text is sufficient.** ${summary.overall.passRate} pass rate.`
  );
} else if (passRate >= 50) {
  lines.push(
    `**Copy text is marginally sufficient.** ${summary.overall.passRate} pass rate.`
  );
  lines.push("Review failure buckets above for targeted improvements.");
} else {
  lines.push(
    `**Copy text is insufficient.** ${summary.overall.passRate} pass rate.`
  );
  lines.push("Significant copy edits needed. See failure buckets above.");
}
lines.push("");
lines.push(
  `Quantitative rationale: ${summary.overall.passes}/${summary.overall.total} trials passed.`
);
if (summary.topFailureBuckets.length > 0) {
  lines.push(
    `Top failure mode: ${summary.topFailureBuckets[0].bucket} (${summary.topFailureBuckets[0].count} occurrences).`
  );
}

writeFileSync(join(RESULTS_DIR, "recommendations.md"), lines.join("\n"));
console.log(`Recommendations written to ${RESULTS_SUBDIR}/recommendations.md`);
