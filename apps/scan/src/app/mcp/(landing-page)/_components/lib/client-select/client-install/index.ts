import type React from 'react';

import { Clients } from '../../../../../_components/clients/data';

import { ClaudeCodeInstall } from './claude-code';
import { CodexInstall } from './codex';
import { CursorInstall } from './cursor';
import { VscodeInstall } from './vscode';

import type { McpSearchParams } from '@/app/mcp/_lib/params';

export type ClientInstallComponent = React.FC<McpSearchParams>;

type ClientInstall = Partial<Record<Clients, ClientInstallComponent | null>>;

export const clientInstall: ClientInstall = {
  [Clients.ClaudeCode]: ClaudeCodeInstall,
  [Clients.Cursor]: CursorInstall,
  [Clients.Codex]: CodexInstall,
  [Clients.Vscode]: VscodeInstall,
};
