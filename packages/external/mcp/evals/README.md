# Claude Agent SDK Multi-Model Evaluation

This directory contains a promptfoo evaluation setup for testing the Claude Agent SDK with MCP tools across multiple models.

## Test Matrix

| Dimension              | Options                                | Count  |
| ---------------------- | -------------------------------------- | ------ |
| **Provider Configs**   | No tools, Web tools, x402scan MCP      | 3      |
| **Prompts**            | Merit funding, CEO email, Top auditors | 3      |
| **Models**             | Haiku 4.5, Sonnet 4.5, Opus 4.5        | 3      |
| **Total Combinations** |                                        | **27** |

## Directory Structure

```
getting-started/
├── promptfooconfig.yaml       # Main config with inline prompts + tests
├── providers/
│   ├── no-tools.yaml          # Baseline (no tools)
│   ├── web-tools.yaml         # WebFetch + WebSearch
│   └── mcp-x402.yaml          # x402scan MCP server
├── extensions/
│   └── log-tools.js           # Session log parser for tool metrics
└── README.md
```

## Setup

```bash
# Set API key
export ANTHROPIC_API_KEY=your_key

# Install Claude Agent SDK (if not already)
npm install @anthropic-ai/claude-agent-sdk
```

## Running

```bash
cd packages/external/mcp/getting-started

# Run evaluation
npx promptfoo@latest eval

# Run without cache (fresh results)
PROMPTFOO_CACHE_ENABLED=false npx promptfoo@latest eval

# View results in browser
npx promptfoo@latest view
```

## Provider Configurations

### No Tools (Baseline)

Tests what the model knows from training data alone.

### Web Tools

Enables `WebFetch` and `WebSearch` for general web access.

### x402scan MCP

Connects to the x402scan MCP server for access to enrichment APIs:

- `mcp__x402scan__fetch` - Call x402-protected endpoints
- `mcp__x402scan__authed_call` - Make authenticated API calls
- `mcp__x402scan__check_balance` - Check wallet balance
- `mcp__x402scan__get_wallet_address` - Get payment wallet
- `mcp__x402scan__check_x402_endpoint` - Verify x402 endpoint status
- `mcp__x402scan__discover_resources` - Find available x402 APIs
- `mcp__x402scan__report_error` - Report errors to x402 system

## Metrics Tracked

The `log-tools.js` extension parses Claude session logs to extract accurate tool usage:

| Metric             | Description               |
| ------------------ | ------------------------- |
| `total_tool_calls` | All tool invocations      |
| `mcp_calls`        | MCP tools (mcp\_\_\*)     |
| `web_calls`        | WebSearch, WebFetch       |
| `file_calls`       | Read, Write, Edit, etc.   |
| `successful_calls` | Tools that succeeded      |
| `failed_calls`     | Tools that errored/denied |
| `cost_usd`         | API cost                  |
| `duration_sec`     | Response time             |
| `num_turns`        | Agent conversation turns  |

## Models

| Model      | ID                           | Budget |
| ---------- | ---------------------------- | ------ |
| Haiku 4.5  | `claude-haiku-4-5-20251001`  | $0.50  |
| Sonnet 4.5 | `claude-sonnet-4-5-20250929` | $1.00  |
| Opus 4.5   | `claude-opus-4-5-20251101`   | $5.00  |

## Output Files

After running, these files are generated:

- `results.json` - Full promptfoo results
- `tool-usage.json` - Latest test's tool analysis
- `tool-usage-log.jsonl` - Append-only log of all tests

## Test Cases

1. **Merit Systems Funding** - Find the total raised ($10M expected)
2. **CEO Email** - Find Merit Systems CEO's email address
3. **Top Auditors** - List top 5 smart contract auditors with Twitter handles
