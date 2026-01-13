# x402scan-mcp

MCP server for calling [x402](https://x402.org)-protected APIs with automatic payment handling.

## Install

### Claude Code

```bash
claude mcp add x402scan --scope user -- npx -y x402scan-mcp@latest
```

### Codex

```bash
codex mcp add x402scan -- npx -y x402scan-mcp@latest
```

### Cursor

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=x402scan&config=eyJjb21tYW5kIjoiL2Jpbi9iYXNoIiwiYXJncyI6WyItYyIsInNvdXJjZSAkSE9NRS8ubnZtL252bS5zaCAyPi9kZXYvbnVsbDsgZXhlYyBucHggLXkgeDQwMnNjYW4tbWNwQGxhdGVzdCJdfQ%3D%3D)

### Claude Desktop

[![Add to Claude](https://img.shields.io/badge/Add_to_Claude-x402scan-blue?logo=anthropic)](https://github.com/merit-systems/x402scan-mcp/raw/main/x402scan.mcpb)

<details>
<summary>Manual installation</summary>

**Codex** - Add to `~/.codex/config.toml`:
```toml
[mcp_servers.x402scan]
command = "npx"
args = ["-y", "x402scan-mcp@latest"]
```

**Cursor** - Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "x402scan": {
      "command": "/bin/bash",
      "args": ["-c", "source $HOME/.nvm/nvm.sh 2>/dev/null; exec npx -y x402scan-mcp@latest"]
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
      "args": ["-c", "source $HOME/.nvm/nvm.sh 2>/dev/null; exec npx -y x402scan-mcp@latest"]
    }
  }
}
```

</details>

## Usage

On first run, a wallet is generated at `~/.x402scan-mcp/wallet.json`. Deposit USDC on Base to the wallet address before making paid API calls.

**Workflow:**
1. `check_balance` - Check wallet and get deposit address
2. `query_endpoint` - Probe endpoint for pricing/schema (optional)
3. `execute_call` - Make the paid request

## Tools (4)

| Tool | Description |
|------|-------------|
| `check_balance` | Get wallet address and USDC balance |
| `query_endpoint` | Probe x402 endpoint for pricing/schema without payment |
| `validate_payment` | Pre-flight check if payment would succeed |
| `execute_call` | Make paid request to x402 endpoint |

## Environment

| Variable | Description |
|----------|-------------|
| `X402_PRIVATE_KEY` | Override wallet (optional) |
| `X402_DEBUG` | Set to `true` for verbose logging |

## Supported Networks

Base, Base Sepolia, Ethereum, Optimism, Arbitrum, Polygon (via CAIP-2)

## Develop

```bash
bun install

# Add local server to Claude Code
claude mcp add x402scan-dev -- bun run /path/to/x402scan-mcp/src/index.ts

# Build
bun run build

# Build .mcpb for Claude Desktop
bun run build:mcpb
```
