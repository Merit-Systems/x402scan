import os from 'os';
import path from 'path';
import process from 'process';
import fs from 'fs';

import { getPlatformPath } from './platforms';
import { log } from '@/lib/log';

import { Clients } from '../clients';

import type { ClientConfigFile } from './types';
import { FileFormat } from './file-types';

export const getClientConfigFile = (client: Clients): ClientConfigFile => {
  const homeDir = os.homedir();
  const { baseDir, vscodePath } = getPlatformPath();

  switch (client) {
    case Clients.Claude:
      return {
        path: path.join(baseDir, 'Claude', 'claude_desktop_config.json'),
        configKey: 'mcpServers',
        format: FileFormat.JSON,
      };
    case Clients.Cline:
      return {
        path: path.join(
          baseDir,
          vscodePath,
          'globalStorage',
          'saoudrizwan.claude-dev',
          'settings',
          'cline_mcp_settings.json'
        ),
        configKey: 'mcpServers',
        format: FileFormat.JSON,
      };
    case Clients.RooCline:
      return {
        path: path.join(
          baseDir,
          vscodePath,
          'globalStorage',
          'rooveterinaryinc.roo-cline',
          'settings',
          'mcp_settings.json'
        ),
        configKey: 'mcpServers',
        format: FileFormat.JSON,
      };
    case Clients.Windsurf:
      return {
        path: path.join(homeDir, '.codeium', 'windsurf', 'mcp_config.json'),
        configKey: 'mcpServers',
        format: FileFormat.JSON,
      };
    case Clients.Cursor:
      return {
        path: path.join(homeDir, '.cursor', 'mcp.json'),
        configKey: 'mcpServers',
        format: FileFormat.JSON,
      };
    case Clients.Warp:
      return {
        path: 'no-local-config', // it's okay this isn't a real path, we never use it
        configKey: 'mcpServers',
        format: FileFormat.JSON,
      };
    case Clients.GeminiCli:
      return {
        path: path.join(homeDir, '.gemini', 'settings.json'),
        configKey: 'mcpServers',
        format: FileFormat.JSON,
      };
    case Clients.Vscode:
      return {
        path: path.join(baseDir, vscodePath, 'mcp.json'),
        configKey: 'mcpServers',
        format: FileFormat.JSON,
      };
    case Clients.ClaudeCode:
      return {
        path: path.join(homeDir, '.claude.json'),
        configKey: 'mcpServers',
        format: FileFormat.JSON,
      };
    case Clients.Goose:
      return {
        path: path.join(homeDir, '.config', 'goose', 'config.yaml'),
        configKey: 'extensions',
        format: FileFormat.YAML,
      };
    case Clients.Zed:
      return {
        path:
          process.platform === 'win32'
            ? path.join(
                process.env.APPDATA ?? path.join(homeDir, 'AppData', 'Roaming'),
                'Zed',
                'settings.json'
              )
            : path.join(homeDir, '.config', 'zed', 'settings.json'),
        configKey: 'context_servers',
        format: FileFormat.JSON,
      };
    case Clients.Codex:
      return {
        path: path.join(
          process.env.CODEX_HOME ?? path.join(homeDir, '.codex'),
          'config.toml'
        ),
        configKey: 'mcp_servers',
        format: FileFormat.TOML,
      };
    case Clients.Opencode: {
      const jsonPath = path.join(
        homeDir,
        '.config',
        'opencode',
        'opencode.json'
      );
      const jsoncPath = jsonPath.replace('.json', '.jsonc');

      // For OpenCode, check if .jsonc exists and prefer it over .json
      if (fs.existsSync(jsoncPath)) {
        log.info(`Found .jsonc file for OpenCode, using: ${jsoncPath}`);
        return {
          path: jsoncPath,
          configKey: 'mcp',
          format: FileFormat.JSON,
        };
      }

      return {
        path: jsonPath,
        configKey: 'mcp',
        format: FileFormat.JSON,
      };
    }
    default:
      throw new Error(`Unknown client: ${String(client)}`);
  }
};
