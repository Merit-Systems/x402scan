/**
 * score.js - Score a single discovery JSON result
 *
 * Usage: node runner/score.js <discovery-json-path> <fixture-type>
 * Or import scoreTrial() for programmatic use.
 */

/**
 * @typedef {Object} TrialScore
 * @property {string} trialId
 * @property {string} fixture
 * @property {string} agentId
 * @property {'pass'|'fail'} result
 * @property {string|null} sourceDetected
 * @property {number} resourceCount
 * @property {string[]} errors
 * @property {string[]} warnings
 * @property {number} timeMs
 * @property {string[]} failureBuckets
 */

/** Failure taxonomy buckets */
const FAILURE_BUCKETS = {
  NO_DISCOVERY_DOC: "no-discovery-doc",
  WRONG_DISCOVERY_PATH: "wrong-discovery-path",
  INVALID_OPENAPI_SHAPE: "invalid-openapi-shape",
  MISSING_402_RESPONSE: "missing-402-response",
  INVALID_ACCEPTS: "invalid-accepts",
  METHOD_MISMATCH: "method-mismatch",
  SCHEMA_MISSING: "schema-missing",
  MISSING_PAID_ROUTES: "missing-paid-routes",
  OTHER: "other",
};

/** Expected paid routes per fixture */
const EXPECTED_ROUTES = {
  "express-openapi": [
    { method: "POST", path: "/api/quote" },
    { method: "POST", path: "/api/enrich" },
  ],
  "next-wellknown": [
    { method: "POST", path: "/api/search" },
    { method: "POST", path: "/api/summarize" },
  ],
};

/**
 * Score a discovery JSON result for a given fixture type.
 * @param {object} discoveryJson - Parsed JSON from `npx @agentcash/discovery --json`
 * @param {string} fixture - 'express-openapi' | 'next-wellknown'
 * @param {string} trialId
 * @param {string} agentId
 * @param {number} timeMs
 * @returns {TrialScore}
 */
export function scoreTrial(discoveryJson, fixture, trialId, agentId, timeMs) {
  const errors = [];
  const warnings = [];
  const failureBuckets = [];

  const ok = discoveryJson?.ok === true;
  const resources = discoveryJson?.resources || [];
  const selectedStage = discoveryJson?.selectedStage || null;
  const traceWarnings = discoveryJson?.warnings || [];
  const durationMs = discoveryJson?.meta?.durationMs || 0;

  // Collect warnings from discovery output
  for (const w of traceWarnings) {
    if (w.severity === "error") {
      errors.push(`[${w.code}] ${w.message}`);
    } else {
      warnings.push(`[${w.code}] ${w.message}`);
    }
  }

  // Check 1: Discovery succeeded (resources found)
  if (!ok || resources.length === 0) {
    errors.push("Discovery found no resources");
    failureBuckets.push(FAILURE_BUCKETS.NO_DISCOVERY_DOC);
  }

  // Check 2: Source precedence is correct for fixture
  if (fixture === "express-openapi") {
    if (selectedStage && selectedStage !== "openapi") {
      warnings.push(
        `Expected openapi source, got ${selectedStage} (still passes if resources found)`
      );
    }
  } else if (fixture === "next-wellknown") {
    if (
      selectedStage &&
      selectedStage !== "well-known/x402" &&
      selectedStage !== "openapi"
    ) {
      warnings.push(
        `Expected well-known/x402 source, got ${selectedStage} (still passes if resources found)`
      );
    }
  }

  // Check 3: Resources have valid structure
  for (const r of resources) {
    if (!r.method) {
      errors.push(`Resource ${r.resourceKey}: missing method`);
      failureBuckets.push(FAILURE_BUCKETS.METHOD_MISMATCH);
    }
    if (!r.path) {
      errors.push(`Resource ${r.resourceKey}: missing path`);
      failureBuckets.push(FAILURE_BUCKETS.OTHER);
    }
  }

  // Check 4: Verify all expected paid routes were discovered
  const expected = EXPECTED_ROUTES[fixture] || [];
  if (expected.length > 0 && resources.length > 0) {
    const discoveredKeys = new Set(
      resources.map((r) => `${(r.method || "").toUpperCase()} ${r.path}`)
    );
    const missing = expected.filter(
      (e) => !discoveredKeys.has(`${e.method} ${e.path}`)
    );
    if (missing.length > 0) {
      const missingStr = missing
        .map((m) => `${m.method} ${m.path}`)
        .join(", ");
      errors.push(`Missing expected paid routes: ${missingStr}`);
      failureBuckets.push(FAILURE_BUCKETS.MISSING_PAID_ROUTES);
    }
  }

  // Check 5: For openapi fixture, check OpenAPI-specific quality
  if (fixture === "express-openapi" && selectedStage === "openapi") {
    for (const r of resources) {
      if (!r.authHint) {
        warnings.push(
          `Resource ${r.resourceKey}: missing authHint`
        );
      }
      if (!r.pricing && !r.priceHint) {
        warnings.push(
          `Resource ${r.resourceKey}: missing pricing info (x-payment-info not set)`
        );
      }
    }
  }

  // Check 6: Check trace for stage-level errors
  const trace = discoveryJson?.trace || [];
  for (const stage of trace) {
    if (stage.attempted && !stage.valid && stage.warnings) {
      for (const w of stage.warnings) {
        if (w.severity === "error") {
          if (w.code?.includes("OPENAPI")) {
            failureBuckets.push(FAILURE_BUCKETS.INVALID_OPENAPI_SHAPE);
          } else if (w.code?.includes("402")) {
            failureBuckets.push(FAILURE_BUCKETS.MISSING_402_RESPONSE);
          }
        }
      }
    }
  }

  // Determine pass/fail
  const hasCriticalErrors = errors.length > 0;
  const result = ok && !hasCriticalErrors ? "pass" : "fail";

  // If failed and no bucket assigned, classify
  if (result === "fail" && failureBuckets.length === 0) {
    if (!ok && resources.length === 0) {
      const openapiTrace = trace.find((t) => t.stage === "openapi");
      const wellKnownTrace = trace.find(
        (t) => t.stage === "well-known/x402"
      );

      if (fixture === "express-openapi") {
        if (openapiTrace && !openapiTrace.valid) {
          failureBuckets.push(FAILURE_BUCKETS.INVALID_OPENAPI_SHAPE);
        } else {
          failureBuckets.push(FAILURE_BUCKETS.NO_DISCOVERY_DOC);
        }
      } else {
        if (wellKnownTrace && !wellKnownTrace.valid) {
          failureBuckets.push(FAILURE_BUCKETS.WRONG_DISCOVERY_PATH);
        } else {
          failureBuckets.push(FAILURE_BUCKETS.NO_DISCOVERY_DOC);
        }
      }
    } else {
      failureBuckets.push(FAILURE_BUCKETS.OTHER);
    }
  }

  return {
    trialId,
    fixture,
    agentId,
    result,
    sourceDetected: selectedStage,
    resourceCount: resources.length,
    errors,
    warnings,
    timeMs: timeMs || durationMs,
    failureBuckets: [...new Set(failureBuckets)],
  };
}

/**
 * Aggregate multiple trial scores into a summary.
 */
export function summarize(trials) {
  const total = trials.length;
  const passes = trials.filter((t) => t.result === "pass").length;
  const fails = total - passes;

  const byFixture = {};
  for (const t of trials) {
    if (!byFixture[t.fixture]) {
      byFixture[t.fixture] = { total: 0, passes: 0, fails: 0, times: [] };
    }
    byFixture[t.fixture].total++;
    if (t.result === "pass") byFixture[t.fixture].passes++;
    else byFixture[t.fixture].fails++;
    byFixture[t.fixture].times.push(t.timeMs);
  }

  // Failure bucket counts
  const bucketCounts = {};
  for (const t of trials) {
    for (const b of t.failureBuckets) {
      bucketCounts[b] = (bucketCounts[b] || 0) + 1;
    }
  }

  const topBuckets = Object.entries(bucketCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([bucket, count]) => ({ bucket, count }));

  const allTimes = trials.map((t) => t.timeMs).sort((a, b) => a - b);
  const medianTime =
    allTimes.length > 0 ? allTimes[Math.floor(allTimes.length / 2)] : 0;

  const fixtureBreakdown = {};
  for (const [name, data] of Object.entries(byFixture)) {
    const sortedTimes = data.times.sort((a, b) => a - b);
    fixtureBreakdown[name] = {
      total: data.total,
      passes: data.passes,
      fails: data.fails,
      passRate: `${((data.passes / data.total) * 100).toFixed(0)}%`,
      medianTimeMs: sortedTimes[Math.floor(sortedTimes.length / 2)] || 0,
    };
  }

  return {
    overall: {
      total,
      passes,
      fails,
      passRate: `${((passes / total) * 100).toFixed(0)}%`,
      medianCompletionTimeMs: medianTime,
    },
    byFixture: fixtureBreakdown,
    topFailureBuckets: topBuckets,
    trials,
  };
}

// CLI usage
if (process.argv[1]?.endsWith("score.js") && process.argv.length >= 3) {
  const fs = await import("fs");
  const jsonPath = process.argv[2];
  const fixture = process.argv[3] || "unknown";
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const result = scoreTrial(data, fixture, "cli-test", "cli", 0);
  console.log(JSON.stringify(result, null, 2));
}
