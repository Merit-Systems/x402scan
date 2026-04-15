# Discovery Copy-for-Agents Eval

Tests whether a short "copy-for-agents" text is sufficient for an AI agent to implement working
x402 discovery on a server it hasn't seen before. This is a capability eval, not a docs prose test.

## Philosophy

The copy text (`prompts/copy-for-agents-v3.txt`) is the only reference an agent gets. No docs
links, no examples repo, no prior context. If agents can't implement discovery from the copy
alone, the copy needs to be better.

Each trial:
1. Copies a fixture server to a temp dir
2. Gives the agent the copy text + fixture source files
3. Lets the agent edit files (budget-capped at $1)
4. Starts the server and runs `npx @agentcash/discovery` against it
5. Scores pass/fail based on discovery output

## Fixtures

Both fixtures are intentionally realistic — multiple paid routes, free endpoint distractors, and
**broken existing discovery attempts** that agents must recognize and fix/replace.

**express-openapi** — Express server, 2 paid POST routes (`/api/quote`, `/api/enrich`), 2 free
GET routes, and a broken `.well-known/x402` with wrong version and object entries.

**next-wellknown** — Next.js App Router, 2 paid POST routes (`/api/search`, `/api/summarize`),
1 free GET route, and a broken `.well-known/x402` with wrong format.

## Running

Prerequisites: Node.js 18+, `claude` CLI installed and authenticated.

```bash
# Full run: 10 trials per fixture, 3 concurrent
cd evals
chmod +x runner/*.sh
./runner/batch.sh

# Custom: 5 trials, concurrency 2, different prompt, named results
./runner/batch.sh 5 2 prompts/copy-for-agents-v3.txt results-experiment

# Single trial (for debugging)
./runner/trial.sh express-openapi 0 3100

# Re-aggregate existing results
node runner/aggregate.js results
```

Output goes to `results/` (gitignored):
- `results/trials/<fixture>-<n>/` — per-trial discovery.json, score.json, agent logs
- `results/summary.json` — aggregate stats
- `results/recommendations.md` — human-readable report with verdict

## Scoring

Pass requires:
- `npx @agentcash/discovery` returns `ok: true`
- No error-severity warnings in discovery output
- All expected paid routes are discovered (2 per fixture)

Failure buckets: `no-discovery-doc`, `invalid-openapi-shape`, `missing-paid-routes`,
`missing-402-response`, `method-mismatch`, `other`.

## Iterating on copy text

1. Add a new prompt file to `prompts/`
2. Run: `./runner/batch.sh 10 3 prompts/my-new-copy.txt results-new`
3. Compare `results-new/summary.json` against previous runs

## Results history

| Eval | Copy | Fixtures | Pass Rate |
|------|------|----------|-----------|
| v1 | v1 (validation-only) | easy (1 route) | 0% |
| v2 | v2 (added schemas) | easy | 30% |
| v3 | v3 (price/auth explicit) | easy | 60% |
| v3-hard | v3 | hard (2 routes + distractors + broken discovery) | 100% |

---

## Validator Seam Evals (x402scan registration path)

Use this when you want to validate that malformed x402 payloads fail with structured, parseable
diagnostics (`error.issues[]` + `error.parseErrors[]`) through x402scan APIs.

### What it covers

- invalid Solana alias in v1 (`solana-mainnet-beta`)
- invalid v2 CAIP format
- missing `accepts`
- missing input schema
- missing output schema (strict)
- Coinbase structural schema failure
- invalid `accepts` shape

### Run

Prereqs:
- x402scan app running locally (default `http://localhost:3000`)
- local pointer to your discovery branch active in x402scan

Commands:

```bash
cd evals
chmod +x runner/validator-seam.sh
./runner/validator-seam.sh
```

Options:

```bash
./runner/validator-seam.sh http://localhost:3000 4102
```

Output:
- fixture logs: `results-validator-seam/fixture.log`
- latest report: `results-validator-seam/latest.json`

Prod sampling helper:
- `runner/prod-solana-sampling.sql` (query real Solana network/schema patterns from scan DB)
