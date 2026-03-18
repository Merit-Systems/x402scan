# x402scan-mcp

MCP server for calling [x402](https://x402.org)-protected APIs with automatic payment handling.

## Install

### Recommended (Guided Install)

```bash
npx @x402scan/mcp install
```

### Claude Code

```bash
claude mcp add x402scan --scope user -- npx -y @x402scan/mcp@latest
```

### Codex

```bash
codex mcp add x402scan -- npx -y @x402scan/mcp@latest
```

### Cursor

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=x402scan&config=eyJjb21tYW5kIjoiL2Jpbi9iYXNoIiwiYXJncyI6WyItYyIsInNvdXJjZSAkSE9NRS8ubnZtL252bS5zaCAyPi9kZXYvbnVsbDsgZXhlYyBucHggLXkgQHg0MDJzY2FuL21jcEBsYXRlc3QiXX0%3D)

### Claude Desktop

[![Add to Claude](https://img.shields.io/badge/Add_to_Claude-x402scan-blue?logo=anthropic)](https://github.com/merit-systems/x402scan-mcp/raw/main/x402scan.mcpb)

<details>
<summary>Manual installation</summary>

**Codex** - Add to `~/.codex/config.toml`:

```toml
[mcp_servers.x402scan]
command = "npx"
args = ["-y", "@x402scan/mcp@latest"]
```

**Cursor** - Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "x402scan": {
      "command": "/bin/bash",
      "args": [
        "-c",
        "source $HOME/.nvm/nvm.sh 2>/dev/null; exec npx -y @x402scan/mcp@latest"
      ]
    }
  }
}
```

**Claude Desktop** - Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "x402scan": {
      "command": "/bin/bash",
      "args": [
        "-c",
        "source $HOME/.nvm/nvm.sh 2>/dev/null; exec npx -y @x402scan/mcp@latest"
      ]
    }
  }
}
```

</details>

## Usage

On first run, a wallet is generated at `~/.x402scan-mcp/wallet.json`. Deposit USDC on Base to the wallet address before making paid API calls.

**Workflow:**

1. `get_wallet_info` - Check wallet and get deposit address
2. `redeem_invite` - Redeem an invite code to fund your wallet (if you have one)
3. `discover_api_endpoints` - Find available x402 endpoints on an origin
4. `check_endpoint_schema` - Probe endpoint for pricing/schema (optional)
5. `fetch` - Make the paid request (or `fetch_with_auth` for SIWX auth)

## Tools

| Tool                     | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `fetch`                  | Fetch x402-protected resource with automatic payment         |
| `fetch_with_auth`        | Make request to SIWX-protected endpoint with automatic auth  |
| `get_wallet_info`        | Get wallet address and USDC balance                          |
| `redeem_invite`          | Redeem an invite code to receive USDC                        |
| `check_endpoint_schema`  | Check if endpoint is x402-protected, get pricing/schema/auth |
| `discover_api_endpoints` | Discover x402 resources from origin's .well-known/x402       |
| `report_error`           | Report critical MCP tool bugs to x402scan developers         |

## Environment

| Variable           | Description                       |
| ------------------ | --------------------------------- |
| `X402_PRIVATE_KEY` | Override wallet (optional)        |
| `X402_DEBUG`       | Set to `true` for verbose logging |

## Supported Networks

Base, Base Sepolia, Ethereum, Optimism, Arbitrum, Polygon (via CAIP-2)

## Develop

```bash
pnpm install

# Build
pnpm -w dev:mcp

# In a separate terminal with cwd packages/external/mcp
pnpm dev install --dev

# Build .mcpb for Claude Desktop
pnpm build:mcpb
```

## Evaluations

MCP changes are automatically tested via CI. Comprehensive evaluations run in the [x402-evals](https://github.com/merit-systems/x402-evals) repository.

### Automatic Checks

- **PR Smoke Test** - Automatically runs when you modify MCP source code
- **Release Eval** - Full evaluation suite runs when a new version is published

### Manual Evaluation

Comment on your PR to trigger evaluations:

| Command                  | Description                              |
| ------------------------ | ---------------------------------------- |
| `/eval` or `/eval smoke` | Quick validation (~2-3 min)              |
| `/eval full`             | Comprehensive testing (~10 min)          |
| `/eval regression`       | Known edge cases and historical failures |

Results are posted back to your PR with a link to detailed metrics.

### Local Evaluation

```bash
# In x402-evals repo
MCP_SERVER_DIR=/path/to/x402scan/packages/external/mcp/dist/esm pnpm --filter @x402-evals/promptfoo eval
```

### Evals on changes to enrichx402 or stablestudio

1. Make a PR in enrichx402 and generate a preview URL with vercel
2. Make a branch in the x402scan repo
3. Replace the enrichx402.com URL in `src/shared/origins.ts` with your preview URL
4. Push and make a PR, then comment on it with "/eval full" (or smoke, regression)

## Publishing

This package uses [changesets](https://github.com/changesets/changesets) for versioning and publishing.

### Standard Release Flow (main branch)

1. Create a changeset describing your changes:
   ```bash
   pnpm changeset
   ```
2. Commit the changeset file with your PR
3. When merged to `main`, the CI creates a "Version Packages" PR
4. Merging the version PR triggers automatic npm publish

### Beta Release Flow (beta branch)

For pre-release versions, use the `beta` branch with prerelease mode:

1. Enter prerelease mode:
   ```bash
   pnpm changeset pre enter beta
   ```
2. Commit the generated `.changeset/pre.json` file
3. Create changesets and merge to `beta` as normal
4. Versions will be published as `x.x.x-beta.x`

To exit prerelease mode and promote to stable:

```bash
pnpm changeset pre exit
```

**Note:** The CI enforces that `beta` branch must have `pre.json` and `main` branch must not.
