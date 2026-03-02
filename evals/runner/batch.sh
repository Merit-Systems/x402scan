#!/bin/bash
# batch.sh - Run all eval trials with controlled concurrency
#
# Usage: ./runner/batch.sh [trials-per-fixture] [concurrency] [prompt-file] [results-subdir]
# Example: ./runner/batch.sh 10 3 prompts/copy-for-agents-v3.txt results-v3

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TRIALS=${1:-10}
CONCURRENCY=${2:-3}
PROMPT_FILE=${3:-prompts/copy-for-agents-v3.txt}
RESULTS_SUBDIR=${4:-results}

FIXTURES=("express-openapi" "next-wellknown")
BASE_PORTS=("3100" "3200")

mkdir -p "$ROOT/$RESULTS_SUBDIR/trials"

echo "=== Discovery Copy-for-Agents Eval ==="
echo "Trials per fixture: $TRIALS"
echo "Concurrency: $CONCURRENCY"
echo "Prompt: $PROMPT_FILE"
echo "Results: $RESULTS_SUBDIR/"
echo "Fixtures: ${FIXTURES[*]}"
echo ""

# Build task list
TASKS=()
for i in "${!FIXTURES[@]}"; do
  FIXTURE="${FIXTURES[$i]}"
  BASE_PORT="${BASE_PORTS[$i]}"
  for j in $(seq 0 $((TRIALS - 1))); do
    PORT=$((BASE_PORT + j * 2))
    TASKS+=("${FIXTURE}|${j}|${PORT}")
  done
done

TOTAL=${#TASKS[@]}
COMPLETED=0

run_task() {
  local TASK="$1"
  IFS='|' read -r FIXTURE TRIAL_IDX PORT <<< "$TASK"
  "$ROOT/runner/trial.sh" "$FIXTURE" "$TRIAL_IDX" "$PORT" "$PROMPT_FILE" "$RESULTS_SUBDIR" 2>&1 | \
    tee "$ROOT/$RESULTS_SUBDIR/trials/${FIXTURE}-${TRIAL_IDX}/trial.log"
}

# Run with concurrency control
RUNNING=0
for TASK in "${TASKS[@]}"; do
  while [ $RUNNING -ge $CONCURRENCY ]; do
    wait -n 2>/dev/null || true
    RUNNING=$((RUNNING - 1))
    COMPLETED=$((COMPLETED + 1))
    echo "--- Progress: $COMPLETED/$TOTAL ---"
  done

  run_task "$TASK" &
  RUNNING=$((RUNNING + 1))
done

# Wait for remaining
wait
echo ""
echo "=== All $TOTAL trials complete ==="

# Aggregate scores
echo "Aggregating results..."
node "${ROOT}/runner/aggregate.js" "$RESULTS_SUBDIR"
