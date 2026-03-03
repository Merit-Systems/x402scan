#!/bin/bash
# validator-seam.sh - Run local validator seam checks against x402scan register API.
#
# Usage:
#   ./evals/runner/validator-seam.sh [x402scan_base_url] [fixture_port]
#
# Example:
#   ./evals/runner/validator-seam.sh http://localhost:3000 4102

set -euo pipefail

SCAN_BASE_URL="${1:-http://localhost:3000}"
FIXTURE_PORT="${2:-4102}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIXTURE_SERVER="${ROOT}/fixtures/validator-errors/server.js"
RESULTS_DIR="${ROOT}/results-validator-seam"
RESULTS_FILE="${RESULTS_DIR}/latest.json"

mkdir -p "$RESULTS_DIR"

CASES=(
  "solana-mainnet-beta-v1|/case/solana-mainnet-beta-v1|NETWORK_SOLANA_ALIAS_INVALID"
  "invalid-caip-v2|/case/invalid-caip-v2|NETWORK_CAIP2_INVALID"
  "missing-accepts-v2|/case/missing-accepts-v2|X402_ACCEPTS_MISSING"
  "missing-input-schema-v2|/case/missing-input-schema-v2|SCHEMA_INPUT_MISSING"
  "missing-output-schema-v2|/case/missing-output-schema-v2|SCHEMA_OUTPUT_MISSING"
  "coinbase-structural-v1|/case/coinbase-structural-v1|COINBASE_SCHEMA_INVALID"
  "accepts-not-array|/case/accepts-not-array|X402_ACCEPTS_INVALID"
)

cleanup() {
  if [ -n "${FIXTURE_PID:-}" ] && kill -0 "$FIXTURE_PID" 2>/dev/null; then
    kill "$FIXTURE_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "Starting validator fixture server on :$FIXTURE_PORT"
PORT="$FIXTURE_PORT" node "$FIXTURE_SERVER" >"$RESULTS_DIR/fixture.log" 2>&1 &
FIXTURE_PID=$!

for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${FIXTURE_PORT}/healthz" >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

if ! curl -fsS "http://127.0.0.1:${FIXTURE_PORT}/healthz" >/dev/null 2>&1; then
  echo "Fixture server failed to start. See $RESULTS_DIR/fixture.log"
  exit 1
fi

TMP_RESULTS=$(mktemp)
echo "[]" >"$TMP_RESULTS"

PASS=0
FAIL=0

echo
echo "Running validator seam checks against ${SCAN_BASE_URL}/api/data/registry/register"

for spec in "${CASES[@]}"; do
  IFS='|' read -r CASE_ID CASE_PATH EXPECTED_CODE <<<"$spec"
  TARGET_URL="http://127.0.0.1:${FIXTURE_PORT}${CASE_PATH}"
  RESPONSE_FILE=$(mktemp)

  HTTP_CODE=$(curl -sS \
    -o "$RESPONSE_FILE" \
    -w "%{http_code}" \
    -X POST "${SCAN_BASE_URL}/api/data/registry/register" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"${TARGET_URL}\"}") || HTTP_CODE="000"

  CHECK=$(node - <<'NODE' "$RESPONSE_FILE" "$CASE_ID" "$EXPECTED_CODE" "$HTTP_CODE"
const fs = require('node:fs');

const [responseFile, caseId, expectedCode, httpCode] = process.argv.slice(2);
const out = {
  caseId,
  expectedCode,
  httpCode,
  ok: false,
  reason: '',
  issueCodes: [],
  parseErrors: [],
};

if (httpCode !== '422' && httpCode !== '200') {
  out.reason = `Unexpected HTTP status ${httpCode}`;
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

let body;
try {
  body = JSON.parse(fs.readFileSync(responseFile, 'utf8'));
} catch (error) {
  out.reason = `Response was not valid JSON: ${String(error)}`;
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

if (body?.success !== false || body?.error?.type !== 'parse_error') {
  out.reason = 'Expected parse_error response shape';
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

const issues = Array.isArray(body?.error?.issues) ? body.error.issues : [];
const issueCodes = issues
  .filter(issue => issue && typeof issue === 'object' && typeof issue.code === 'string')
  .map(issue => issue.code);
out.issueCodes = [...new Set(issueCodes)];
out.parseErrors = Array.isArray(body?.error?.parseErrors) ? body.error.parseErrors : [];

const hasExpectedIssue = out.issueCodes.includes(expectedCode);
const hasExpectedInLegacy = out.parseErrors.some(msg => typeof msg === 'string' && msg.includes(expectedCode));

if (hasExpectedIssue && hasExpectedInLegacy) {
  out.ok = true;
} else {
  out.reason = `Missing expected code ${expectedCode} in issues[] or parseErrors[]`;
}

process.stdout.write(JSON.stringify(out));
NODE
)

  rm -f "$RESPONSE_FILE"

  OK=$(echo "$CHECK" | node -e 'const d = JSON.parse(require("node:fs").readFileSync(0, "utf8")); process.stdout.write(d.ok ? "true" : "false");')

  node - <<'NODE' "$TMP_RESULTS" "$CHECK"
const fs = require('node:fs');
const [file, rowRaw] = process.argv.slice(2);
const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
rows.push(JSON.parse(rowRaw));
fs.writeFileSync(file, JSON.stringify(rows, null, 2));
NODE

  if [ "$OK" = "true" ]; then
    PASS=$((PASS + 1))
    echo "  PASS  ${CASE_ID} -> ${EXPECTED_CODE}"
  else
    FAIL=$((FAIL + 1))
    REASON=$(echo "$CHECK" | node -e 'const d = JSON.parse(require("node:fs").readFileSync(0, "utf8")); process.stdout.write(d.reason || "failed");')
    echo "  FAIL  ${CASE_ID} -> ${EXPECTED_CODE} (${REASON})"
  fi
done

cp "$TMP_RESULTS" "$RESULTS_FILE"
rm -f "$TMP_RESULTS"

echo
echo "Done. pass=${PASS} fail=${FAIL}"
echo "Saved report: ${RESULTS_FILE}"
echo
echo "Tip: if all cases fail with missing issue codes, verify local pointer to @agentcash/discovery is active."

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
