export enum Clients {
  ClaudeCode = 'claude-code',
  Cursor = 'cursor',
  Codex = 'codex',
  Claude = 'claude',
  GeminiCli = 'gemini-cli',
  Vscode = 'vscode',
}

export enum ClientTypes {
  IDE = 'ide',
  TERMINAL = 'terminal',
  DESKTOP = 'desktop',
}

interface ClientMetadata {
  name: string;
  description: string;
  type: ClientTypes;
  recommended?: boolean;
}

export const clients: Record<Clients, ClientMetadata> = {
  [Clients.ClaudeCode]: {
    name: 'Claude Code',
    description: 'Claude Code is a code editor that uses the Claude API.',
    type: ClientTypes.TERMINAL,
  },
  [Clients.Cursor]: {
    name: 'Cursor',
    description: 'Cursor is a code editor that uses the Cursor API.',
    type: ClientTypes.IDE,
  },
  [Clients.Codex]: {
    name: 'Codex',
    description: 'Codex is a code editor that uses the Codex API.',
    type: ClientTypes.TERMINAL,
  },
  [Clients.Claude]: {
    name: 'Claude Desktop',
    description:
      'Claude Desktop is a code editor that uses the Claude Desktop API.',
    type: ClientTypes.DESKTOP,
    recommended: true,
  },
  [Clients.GeminiCli]: {
    name: 'Gemini CLI',
    description: 'Gemini CLI is a code editor that uses the Gemini CLI API.',
    type: ClientTypes.TERMINAL,
  },
  [Clients.Vscode]: {
    name: 'VSCode',
    description: 'VSCode is a code editor that uses the VSCode API.',
    type: ClientTypes.IDE,
  },
};
