import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PrivateKeyAccount } from "viem";

interface RegisterToolsProps {
  server: McpServer;
  account: PrivateKeyAccount;
}

export type RegisterTools = (props: RegisterToolsProps) => void;
