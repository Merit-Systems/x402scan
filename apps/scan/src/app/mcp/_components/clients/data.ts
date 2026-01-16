export enum Clients {
  ClaudeCode = 'claude-code',
  Cursor = 'cursor',
  Codex = 'codex',
  Claude = 'claude',
}

export interface ClientMetadata {
  name: string;
  description: string;
  image: string;
}

export const clientsList: Record<Clients, ClientMetadata> = {
  [Clients.ClaudeCode]: {
    name: 'Claude Code',
    description: 'Claude Code is a code editor that uses the Claude API.',
    image: '/icons/anthropic.png',
  },
  [Clients.Cursor]: {
    name: 'Cursor',
    description: 'Cursor is a code editor that uses the Cursor API.',
    image: '/icons/cursor.png',
  },
  [Clients.Codex]: {
    name: 'Codex',
    description: 'Codex is a code editor that uses the Codex API.',
    image: '/icons/openai.png',
  },
  [Clients.Claude]: {
    name: 'Claude Desktop',
    description:
      'Claude Desktop is a code editor that uses the Claude Desktop API.',
    image: '/icons/claude.png',
  },
};
