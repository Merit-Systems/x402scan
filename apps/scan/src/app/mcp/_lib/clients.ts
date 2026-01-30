import z from 'zod';

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
  className: string;
  recommended?: boolean;
}

export const clients: Record<Clients, ClientMetadata> = {
  [Clients.ClaudeCode]: {
    name: 'Claude Code',
    description: 'Claude Code is a code editor that uses the Claude API.',
    type: ClientTypes.TERMINAL,
    className: 'fill-[#c15f3c]',
  },
  [Clients.Cursor]: {
    name: 'Cursor',
    description: 'Cursor is a code editor that uses the Cursor API.',
    type: ClientTypes.IDE,
    className: 'fill-black dark:fill-white',
  },
  [Clients.Codex]: {
    name: 'Codex',
    description: 'Codex is a code editor that uses the Codex API.',
    type: ClientTypes.TERMINAL,
    className: 'fill-black dark:fill-white',
  },
  [Clients.Claude]: {
    name: 'Claude Desktop',
    description:
      'Claude Desktop is a code editor that uses the Claude Desktop API.',
    type: ClientTypes.DESKTOP,
    recommended: true,
    className: 'fill-[#c15f3c]',
  },
  [Clients.GeminiCli]: {
    name: 'Gemini CLI',
    description: 'Gemini CLI is a code editor that uses the Gemini CLI API.',
    type: ClientTypes.TERMINAL,
    className: 'fill-[#147ffd]',
  },
  [Clients.Vscode]: {
    name: 'VSCode',
    description: 'VSCode is a code editor that uses the VSCode API.',
    type: ClientTypes.IDE,
    className: 'fill-[#0098FF]',
  },
};

export const clientSchema = z.enum(Clients);
