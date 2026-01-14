import { FileFormat } from './file-types/types';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClientConfig = Record<string, any>;

export interface ClientFileTarget {
  type: 'file';
  path: string;
  configKey: string;
  format: FileFormat;
}
