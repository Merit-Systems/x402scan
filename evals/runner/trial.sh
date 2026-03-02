#!/bin/bash
# trial.sh - Run a single eval trial
#
# Usage: ./runner/trial.sh <fixture> <trial-index> <port> [prompt-file] [results-subdir]
# Example: ./runner/trial.sh express-openapi 0 3100 prompts/copy-for-agents-v3.txt results-v3

set -euo pipefail

FIXTURE="$1"
TRIAL_IDX="$2"
PORT="$3"
PROMPT_NAME="${4:-prompts/copy-for-agents-v3.txt}"
RESULTS_SUBDIR="${5:-results}"
TRIAL_ID="${FIXTURE}-${TRIAL_IDX}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RESULTS_DIR="${ROOT}/${RESULTS_SUBDIR}/trials/${TRIAL_ID}"

mkdir -p "$RESULTS_DIR"

log() { echo "[${TRIAL_ID}] $*" >&2; }

# Helper: millisecond timestamp (macOS compatible)
now_ms() { python3 -c "import time; print(int(time.time()*1000))"; }

cleanup() {
  lsof -ti:"$PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
}
trap cleanup EXIT

# 1. Copy fixture to temp dir
TMPDIR=$(mktemp -d "/tmp/eval-${FIXTURE}-XXXXXX")
cp -R "${ROOT}/fixtures/${FIXTURE}/." "$TMPDIR/"
log "Fixture copied to $TMPDIR"

# 2. Install deps
if [ ! -d "$TMPDIR/node_modules" ]; then
  log "Installing dependencies..."
  (cd "$TMPDIR" && npm install --silent 2>&1) >&2
fi

# 3. Build prompt
COPY_TEXT=$(cat "${ROOT}/${PROMPT_NAME}")

# List fixture files (excluding node_modules, .next)
FILE_CONTENTS=""
while IFS= read -r f; do
  FILE_CONTENTS+=$'\n'"--- ${f} ---"$'\n'
  FILE_CONTENTS+="$(cat "${TMPDIR}/${f}")"$'\n'
done < <(find "$TMPDIR" -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/.git/*" \
  -not -path "*/node-compile-cache/*" \
  -not -name "package-lock.json" \
  | sed "s|${TMPDIR}/||" | sort)

PROMPT_FILE="${TMPDIR}/_eval_prompt.md"
if [ "$FIXTURE" = "express-openapi" ]; then
  FIXTURE_HINT="This is an Express server. It may already have a discovery attempt that doesn't work. Add proper discovery (OpenAPI is the recommended approach from the checklist)."
else
  FIXTURE_HINT="This is a Next.js server. It may already have a discovery attempt that doesn't work. Add proper discovery following the checklist."
fi

cat > "$PROMPT_FILE" << PROMPTEOF
You are given a server project and a discovery checklist. Your task is to make this server fully discoverable.

## Discovery Checklist (your only reference)
${COPY_TEXT}

## Server Files
${FILE_CONTENTS}

## Task
Make this server discoverable and passing. The server has paid endpoints that return valid 402 responses. You need to add the static discovery metadata so that \`npx @agentcash/discovery\` finds ALL paid resources.

${FIXTURE_HINT}

Rules:
- Only modify files in the current directory.
- Do NOT start the server yourself. Just add/edit files.
- When done, describe what you changed.
PROMPTEOF

# 4. Invoke Claude agent
log "Invoking Claude agent..."
START_TIME=$(now_ms)

# Unset CLAUDECODE to allow nested sessions; use -p (print) mode with acceptEdits
# Run from the fixture temp dir so the agent sees the project files
(cd "$TMPDIR" && \
  env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT \
  claude -p "$(cat "$PROMPT_FILE")" \
  --output-format text \
  --model sonnet \
  --permission-mode acceptEdits \
  --max-budget-usd 1.00 \
  --no-session-persistence \
  --allowedTools "Read Edit Write Bash Glob Grep" \
  2>"$RESULTS_DIR/agent-stderr.log" \
  >"$RESULTS_DIR/agent-stdout.log" \
) || log "Agent exited with code $?"

END_AGENT=$(now_ms)
AGENT_TIME=$((END_AGENT - START_TIME))
log "Agent done in ${AGENT_TIME}ms"

# 5. Start the server
log "Starting fixture server on port $PORT..."
if [ "$FIXTURE" = "express-openapi" ]; then
  (cd "$TMPDIR" && PORT=$PORT node server.js 2>"$RESULTS_DIR/server-stderr.log" &)
else
  # Next.js: try build+start, fall back to dev
  if (cd "$TMPDIR" && npx next build 2>"$RESULTS_DIR/build-stderr.log" >&2); then
    (cd "$TMPDIR" && PORT=$PORT npx next start -p "$PORT" 2>"$RESULTS_DIR/server-stderr.log" &)
  else
    log "Build failed, using dev mode"
    (cd "$TMPDIR" && PORT=$PORT npx next dev -p "$PORT" 2>"$RESULTS_DIR/server-stderr.log" &)
  fi
fi

# Wait for server
for i in $(seq 1 30); do
  if curl -sf "http://localhost:$PORT" >/dev/null 2>&1 || \
     curl -s "http://localhost:$PORT" -o /dev/null -w "%{http_code}" 2>/dev/null | grep -q "200\|404"; then
    break
  fi
  sleep 0.5
done

# Give extra time for Next.js cold start
sleep 1

# 6. Run discovery
log "Running discovery..."
set +e
DISCOVERY_JSON=$(npx -y @agentcash/discovery "http://localhost:$PORT" --json 2>/dev/null)
DISCOVERY_EXIT=$?
set -e
if [ -z "$DISCOVERY_JSON" ] || ! echo "$DISCOVERY_JSON" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
  DISCOVERY_JSON='{"ok":false,"resources":[],"warnings":[],"trace":[],"meta":{}}'
fi
echo "$DISCOVERY_JSON" > "$RESULTS_DIR/discovery.json"

# Also capture verbose
npx -y @agentcash/discovery "http://localhost:$PORT" -v > "$RESULTS_DIR/verbose.txt" 2>&1 || true

END_TIME=$(now_ms)
TOTAL_TIME=$((END_TIME - START_TIME))

# 7. Save file list
find "$TMPDIR" -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/node-compile-cache/*" \
  -not -path "*/.claude/*" \
  -not -name "package-lock.json" \
  -not -name "_eval_prompt.md" \
  -not -name "*.tgz" \
  | sed "s|${TMPDIR}/||" | sort > "$RESULTS_DIR/files.txt"

# 8. Score
log "Scoring..."
set +e
SCORE_RAW=$(node "${ROOT}/runner/score.js" "$RESULTS_DIR/discovery.json" "$FIXTURE" 2>/dev/null)
if [ $? -eq 0 ] && [ -n "$SCORE_RAW" ]; then
  # Patch in trial metadata
  echo "$SCORE_RAW" | python3 -c "
import sys, json
data = json.load(sys.stdin)
data['trialId'] = '${TRIAL_ID}'
data['agentId'] = 'trial-${TRIAL_IDX}'
data['timeMs'] = ${TOTAL_TIME}
json.dump(data, open('${RESULTS_DIR}/score.json', 'w'), indent=2)
print(json.dumps(data))
"
else
  FALLBACK='{"trialId":"'"${TRIAL_ID}"'","fixture":"'"${FIXTURE}"'","agentId":"trial-'"${TRIAL_IDX}"'","result":"fail","sourceDetected":null,"resourceCount":0,"errors":["scoring failed"],"warnings":[],"timeMs":'"${TOTAL_TIME}"',"failureBuckets":["other"]}'
  echo "$FALLBACK" > "$RESULTS_DIR/score.json"
  echo "$FALLBACK"
fi
set -e

log "Trial complete (${TOTAL_TIME}ms)"
