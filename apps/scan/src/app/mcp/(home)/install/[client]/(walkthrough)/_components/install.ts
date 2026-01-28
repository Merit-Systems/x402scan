import type React from 'react';

import { Clients } from '@/app/mcp/_lib/clients';

import { ClaudeCodeInstall } from './client-install/claude-code';
import { CodexInstall } from './client-install/codex';
import { CursorInstall } from './client-install/cursor';
import { VscodeInstall } from './client-install/vscode';

import type { McpSearchParams } from '@/app/mcp/_lib/params';

export type ClientInstallComponent = React.FC<McpSearchParams>;

type ClientInstall = Partial<Record<Clients, ClientInstallComponent | null>>;

export const clientInstall: ClientInstall = {
  [Clients.ClaudeCode]: ClaudeCodeInstall,
  [Clients.Cursor]: CursorInstall,
  [Clients.Codex]: CodexInstall,
  [Clients.Vscode]: VscodeInstall,
};
