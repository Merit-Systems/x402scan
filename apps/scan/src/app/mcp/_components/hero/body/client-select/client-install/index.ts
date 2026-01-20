import type React from 'react';

import { Clients } from '../../../../clients/data';

import { ClaudeCodeInstall } from './claude-code';
import { CodexInstall } from './codex';
import { CursorInstall } from './cursor';
import { VscodeInstall } from './vscode';

type ClientInstall = Record<Clients, React.FC>;

export const clientInstall: ClientInstall = {
  [Clients.ClaudeCode]: ClaudeCodeInstall,
  [Clients.Cursor]: CursorInstall,
  [Clients.Codex]: CodexInstall,
  [Clients.Claude]: ClaudeCodeInstall,
  [Clients.GeminiCli]: ClaudeCodeInstall,
  [Clients.Vscode]: VscodeInstall,
};
