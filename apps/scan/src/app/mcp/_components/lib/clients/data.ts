export enum Clients {
  ClaudeCode = 'claude-code',
  Cursor = 'cursor',
  Codex = 'codex',
  Claude = 'claude',
  GeminiCli = 'gemini-cli',
  Vscode = 'vscode',
}

interface ClientMetadata {
  name: string;
  description: string;
  recommended?: boolean;
}

export const clients: Record<Clients, ClientMetadata> = {
  [Clients.ClaudeCode]: {
    name: 'Claude Code',
    description: 'Claude Code is a code editor that uses the Claude API.',
    recommended: true,
  },
  [Clients.Cursor]: {
    name: 'Cursor',
    description: 'Cursor is a code editor that uses the Cursor API.',
  },
  [Clients.Codex]: {
    name: 'Codex',
    description: 'Codex is a code editor that uses the Codex API.',
  },
  [Clients.Claude]: {
    name: 'Claude Desktop',
    description:
      'Claude Desktop is a code editor that uses the Claude Desktop API.',
  },
  [Clients.GeminiCli]: {
    name: 'Gemini CLI',
    description: 'Gemini CLI is a code editor that uses the Gemini CLI API.',
  },
  [Clients.Vscode]: {
    name: 'VSCode',
    description: 'VSCode is a code editor that uses the VSCode API.',
  },
};
