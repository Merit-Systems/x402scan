export enum Clients {
  ClaudeCode = 'claude-code',
  Cursor = 'cursor',
  Claude = 'claude',
  Codex = 'codex',
  Vscode = 'vscode',
  Cline = 'cline',
  RooCline = 'roo-cline',
  Windsurf = 'windsurf',
  Warp = 'warp',
  GeminiCli = 'gemini-cli',
  Goose = 'goose',
  Zed = 'zed',
  Opencode = 'opencode',
}

interface ClientMetadata {
  name: string;
  description: string;
  website: string;
}

export const clientMetadata: Record<Clients, ClientMetadata> = {
  [Clients.ClaudeCode]: {
    name: 'Claude Code',
    description: 'Claude Code is a code editor that uses the Claude API.',
    website: 'https://claude.com',
  },
  [Clients.Cursor]: {
    name: 'Cursor',
    description: 'Cursor is a code editor that uses the Cursor API.',
    website: 'https://cursor.com',
  },
  [Clients.Claude]: {
    name: 'Claude',
    description: 'Claude is a code editor that uses the Claude API.',
    website: 'https://claude.com',
  },
  [Clients.Codex]: {
    name: 'Codex',
    description: 'Codex is a code editor that uses the Codex API.',
    website: 'https://codex.com',
  },
  [Clients.Vscode]: {
    name: 'VSCode',
    description: 'VSCode is a code editor that uses the VSCode API.',
    website: 'https://vscode.com',
  },
  [Clients.Cline]: {
    name: 'Cline',
    description: 'Cline is a code editor that uses the Cline API.',
    website: 'https://cline.com',
  },
  [Clients.RooCline]: {
    name: 'RooCline',
    description: 'RooCline is a code editor that uses the RooCline API.',
    website: 'https://roo-cline.com',
  },
  [Clients.Windsurf]: {
    name: 'Windsurf',
    description: 'Windsurf is a code editor that uses the Windsurf API.',
    website: 'https://windsurf.com',
  },
  [Clients.Warp]: {
    name: 'Warp',
    description: 'Warp is a code editor that uses the Warp API.',
    website: 'https://warp.com',
  },
  [Clients.GeminiCli]: {
    name: 'Gemini CLI',
    description: 'Gemini CLI is a code editor that uses the Gemini CLI API.',
    website: 'https://gemini-cli.com',
  },
  [Clients.Goose]: {
    name: 'Goose',
    description: 'Goose is a code editor that uses the Goose API.',
    website: 'https://goose.com',
  },
  [Clients.Zed]: {
    name: 'Zed',
    description: 'Zed is a code editor that uses the Zed API.',
    website: 'https://zed.com',
  },
  [Clients.Opencode]: {
    name: 'Opencode',
    description: 'Opencode is a code editor that uses the Opencode API.',
    website: 'https://opencode.com',
  },
};
