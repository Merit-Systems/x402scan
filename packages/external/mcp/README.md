# x402scan-mcp

MCP server for calling [x402](https://x402.org)-protected APIs with automatic payment handling.

## Install

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

1. `check_balance` - Check wallet and get deposit address
2. `discover_resources` - Find available x402 endpoints on an origin
3. `check_x402_endpoint` - Probe endpoint for pricing/schema (optional)
4. `fetch` - Make the paid request (or `authed_call` for SIWX auth)

## Tools (7)

| Tool                  | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `fetch`               | Fetch x402-protected resource with automatic payment         |
| `authed_call`         | Make request to SIWX-protected endpoint with automatic auth  |
| `check_balance`       | Get wallet address and USDC balance                          |
| `get_wallet_address`  | Get the wallet address                                       |
| `check_x402_endpoint` | Check if endpoint is x402-protected, get pricing/schema/auth |
| `discover_resources`  | Discover x402 resources from origin's .well-known/x402       |
| `report_error`        | Emergency: report critical MCP bugs to developers            |

## Environment

| Variable           | Description                       |
| ------------------ | --------------------------------- |
| `X402_PRIVATE_KEY` | Override wallet (optional)        |
| `X402_DEBUG`       | Set to `true` for verbose logging |

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
