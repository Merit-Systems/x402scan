import fs from 'fs';
import os from 'os';
import path from 'path';
import process from 'process';

import * as TOML from '@iarna/toml';
import yaml from 'js-yaml';
import * as jsonc from 'jsonc-parser';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClientConfig = Record<string, any>;

interface ClientFileTarget {
  type: 'file';
  path: string;
  localPath?: string;
  configKey: string;
  format?: 'json' | 'yaml' | 'toml'; // Add format property for different file types
}
type ClientInstallTarget = ClientFileTarget;

// Initialize platform-specific paths
function getPlatformPaths() {
  const homeDir = os.homedir();
  return {
    win32: {
      baseDir: process.env.APPDATA ?? path.join(homeDir, 'AppData', 'Roaming'),
      vscodePath: path.join('Code', 'User'),
    },
    darwin: {
      baseDir: path.join(homeDir, 'Library', 'Application Support'),
      vscodePath: path.join('Code', 'User'),
    },
    linux: {
      baseDir: process.env.XDG_CONFIG_HOME ?? path.join(homeDir, '.config'),
      vscodePath: path.join('Code/User'),
    },
  };
}

function getBasePaths() {
  const platformPaths = getPlatformPaths();
  const platform = process.platform as keyof typeof platformPaths;
  const { baseDir, vscodePath } = platformPaths[platform];
  const defaultClaudePath = path.join(
    baseDir,
    'Claude',
    'claude_desktop_config.json'
  );
  return { baseDir, vscodePath, defaultClaudePath };
}

// Define client paths using the platform-specific base directories
function getClientPaths(): Record<string, ClientInstallTarget> {
  const { baseDir, vscodePath, defaultClaudePath } = getBasePaths();
  const homeDir = os.homedir();

  return {
    claude: { type: 'file', path: defaultClaudePath, configKey: 'mcpServers' },
    droid: {
      type: 'file',
      path: path.join(homeDir, '.factory', 'mcp.json'),
      localPath: path.join(process.cwd(), '.factory', 'mcp.json'),
      configKey: 'mcpServers',
    },
    cline: {
      type: 'file',
      path: path.join(
        baseDir,
        vscodePath,
        'globalStorage',
        'saoudrizwan.claude-dev',
        'settings',
        'cline_mcp_settings.json'
      ),
      configKey: 'mcpServers',
    },
    'roo-cline': {
      type: 'file',
      path: path.join(
        baseDir,
        vscodePath,
        'globalStorage',
        'rooveterinaryinc.roo-cline',
        'settings',
        'mcp_settings.json'
      ),
      configKey: 'mcpServers',
    },
    windsurf: {
      type: 'file',
      path: path.join(homeDir, '.codeium', 'windsurf', 'mcp_config.json'),
      configKey: 'mcpServers',
    },
    witsy: {
      type: 'file',
      path: path.join(baseDir, 'Witsy', 'settings.json'),
      configKey: 'mcpServers',
    },
    enconvo: {
      type: 'file',
      path: path.join(homeDir, '.config', 'enconvo', 'mcp_config.json'),
      configKey: 'mcpServers',
    },
    cursor: {
      type: 'file',
      path: path.join(homeDir, '.cursor', 'mcp.json'),
      localPath: path.join(process.cwd(), '.cursor', 'mcp.json'),
      configKey: 'mcpServers',
    },
    warp: {
      type: 'file',
      path: 'no-local-config', // it's okay this isn't a real path, we never use it
      configKey: 'mcpServers',
    },
    'gemini-cli': {
      type: 'file',
      path: path.join(homeDir, '.gemini', 'settings.json'),
      localPath: path.join(process.cwd(), '.gemini', 'settings.json'),
      configKey: 'mcpServers',
    },
    vscode: {
      type: 'file',
      path: path.join(baseDir, vscodePath, 'mcp.json'),
      localPath: path.join(process.cwd(), '.vscode', 'mcp.json'),
      configKey: 'mcpServers',
    },
    'claude-code': {
      type: 'file',
      path: path.join(homeDir, '.claude.json'),
      localPath: path.join(process.cwd(), '.mcp.json'),
      configKey: 'mcpServers',
    },
    goose: {
      type: 'file',
      path: path.join(homeDir, '.config', 'goose', 'config.yaml'),
      configKey: 'extensions',
      format: 'yaml',
    },
    zed: {
      type: 'file',
      path:
        process.platform === 'win32'
          ? path.join(
              process.env.APPDATA ?? path.join(homeDir, 'AppData', 'Roaming'),
              'Zed',
              'settings.json'
            )
          : path.join(homeDir, '.config', 'zed', 'settings.json'),
      configKey: 'context_servers',
    },
    codex: {
      type: 'file',
      path: path.join(
        process.env.CODEX_HOME ?? path.join(homeDir, '.codex'),
        'config.toml'
      ),
      configKey: 'mcp_servers',
      format: 'toml',
    },
    opencode: {
      type: 'file',
      path: path.join(homeDir, '.config', 'opencode', 'opencode.json'),
      localPath: path.join(process.cwd(), '.opencode.json'),
      configKey: 'mcp',
    },
    aider: {
      type: 'file',
      path: path.join(homeDir, '.aider', 'mcp.yml'),
      localPath: path.join(process.cwd(), '.aider.mcp.yml'),
      configKey: 'servers',
      format: 'yaml',
    },
    'aider-desk': {
      type: 'file',
      path:
        process.platform === 'win32'
          ? path.join(
              process.env.APPDATA ?? path.join(homeDir, 'AppData', 'Roaming'),
              'aider-desk',
              'settings.json'
            )
          : process.platform === 'darwin'
            ? path.join(
                homeDir,
                'Library',
                'Application Support',
                'aider-desk',
                'settings.json'
              )
            : path.join(homeDir, '.config', 'aider-desk', 'settings.json'),
      configKey: 'mcpServers',
    },
  };
}

export const clientNames = [
  'claude',
  'droid',
  'cline',
  'roo-cline',
  'windsurf',
  'witsy',
  'enconvo',
  'cursor',
  'warp',
  'gemini-cli',
  'vscode',
  'claude-code',
  'goose',
  'zed',
  'codex',
  'opencode',
  'aider',
  'aider-desk',
];

// Helper function to get nested value from an object using dot notation
export function getNestedValue(
  obj: ClientConfig,
  path: string
): ClientConfig | undefined {
  const keys = path.split('.');
  let current: ClientConfig | undefined = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key] as ClientConfig;
    } else {
      return undefined;
    }
  }
  return current;
}

// Helper function to set nested value in an object using dot notation
export function setNestedValue(
  obj: ClientConfig,
  path: string,
  value: ClientConfig
): void {
  const keys = path.split('.');
  const lastKey = keys.pop();
  if (!lastKey) return;
  const target = keys.reduce((current, key) => {
    current[key] ??= {};
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return current[key];
  }, obj);
  target[lastKey] = value;
}

export function getConfigPath(client: string): ClientInstallTarget {
  const normalizedClient = client.toLowerCase();
  const clientPaths = getClientPaths();
  const configTarget = clientPaths[normalizedClient];
  if (!configTarget) {
    throw new Error(`Config target not found for client: ${client}`);
  }

  // For OpenCode, check if .jsonc exists and prefer it over .json
  if (normalizedClient === 'opencode') {
    const jsoncPath = configTarget.path.replace('.json', '.jsonc');
    if (fs.existsSync(jsoncPath)) {
      console.log(`Found .jsonc file for OpenCode, using: ${jsoncPath}`);
      return { ...configTarget, path: jsoncPath };
    }
  }

  console.log(
    `Using default config path for ${normalizedClient}: ${configTarget.path}`
  );
  return configTarget;
}

export function readConfig(client: string, local?: boolean): ClientConfig {
  console.log(`Reading config for client: ${client}${local ? ' (local)' : ''}`);
  try {
    const configPath = getConfigPath(client);

    console.log(`Checking if config file exists at: ${configPath.path}`);
    if (!fs.existsSync(configPath.path)) {
      console.log('Config file not found, returning default empty config');
      const defaultConfig: ClientConfig = {};
      setNestedValue(defaultConfig, configPath.configKey, {});
      return defaultConfig;
    }

    console.log('Reading config file content');
    const fileContent = fs.readFileSync(configPath.path, 'utf8');

    let rawConfig: ClientConfig;
    if (configPath.format === 'yaml') {
      rawConfig = (yaml.load(fileContent) as ClientConfig) || {};
    } else if (configPath.format === 'toml') {
      rawConfig = TOML.parse(fileContent) as ClientConfig;
    } else if (configPath.path.endsWith('.jsonc')) {
      // Use jsonc-parser for .jsonc files to support comments
      rawConfig = jsonc.parse(fileContent) as ClientConfig;
    } else {
      rawConfig = JSON.parse(fileContent) as ClientConfig;
    }

    console.log(
      `Config loaded successfully: ${JSON.stringify(rawConfig, null, 2)}`
    );

    // Ensure the nested structure exists
    const existingValue = getNestedValue(rawConfig, configPath.configKey);
    if (!existingValue) {
      setNestedValue(rawConfig, configPath.configKey, {});
    }

    return rawConfig;
  } catch (error) {
    console.log(
      `Error reading config: ${error instanceof Error ? error.stack : JSON.stringify(error)}`
    );
    const configPath = getConfigPath(client);
    const defaultConfig: ClientConfig = {};
    setNestedValue(defaultConfig, configPath.configKey, {});
    return defaultConfig;
  }
}

export function writeConfig(config: ClientConfig, client: string): void {
  console.log(`Writing config for client: ${client}`);
  console.log(`Config data: ${JSON.stringify(config, null, 2)}`);

  const configPath = getConfigPath(client);

  const nestedValue = getNestedValue(config, configPath.configKey);
  if (!nestedValue || typeof nestedValue !== 'object') {
    console.log(`Invalid ${configPath.configKey} structure in config`);
    throw new Error(`Invalid ${configPath.configKey} structure`);
  }

  writeConfigFile(config, configPath);
}

// Helper function for deep merge
function deepMerge(target: ClientConfig, source: ClientConfig): ClientConfig {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      result[key] = deepMerge(result[key] ?? {}, source[key] as ClientConfig);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      result[key] = source[key];
    }
  }

  return result;
}

function writeConfigFile(config: ClientConfig, target: ClientFileTarget): void {
  const configDir = path.dirname(target.path);

  console.log(`Ensuring config directory exists: ${configDir}`);
  if (!fs.existsSync(configDir)) {
    console.log(`Creating directory: ${configDir}`);
    fs.mkdirSync(configDir, { recursive: true });
  }

  let existingConfig: ClientConfig = {};
  setNestedValue(existingConfig, target.configKey, {});

  let originalFileContent = '';
  try {
    if (fs.existsSync(target.path)) {
      console.log('Reading existing config file for merging');
      originalFileContent = fs.readFileSync(target.path, 'utf8');

      if (target.format === 'yaml') {
        existingConfig = (yaml.load(originalFileContent) as ClientConfig) || {};
      } else if (target.format === 'toml') {
        existingConfig = TOML.parse(originalFileContent) as ClientConfig;
      } else if (target.path.endsWith('.jsonc')) {
        // Use jsonc-parser for .jsonc files to support comments
        existingConfig = jsonc.parse(originalFileContent) as ClientConfig;
      } else {
        existingConfig = JSON.parse(originalFileContent) as ClientConfig;
      }

      console.log(
        `Existing config loaded: ${JSON.stringify(existingConfig, null, 2)}`
      );
    }
  } catch (error) {
    console.log(
      `Error reading existing config for merge: ${error instanceof Error ? error.message : String(error)}`
    );
    // If reading fails, continue with empty existing config
  }

  console.log('Merging configs');
  const mergedConfig = deepMerge(existingConfig, config);
  console.log(`Merged config: ${JSON.stringify(mergedConfig, null, 2)}`);

  console.log(`Writing config to file: ${target.path}`);

  let configContent: string;
  if (target.format === 'yaml') {
    configContent = yaml.dump(mergedConfig, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    });
  } else if (target.format === 'toml') {
    configContent = TOML.stringify(mergedConfig);
  } else if (target.path.endsWith('.jsonc') && originalFileContent) {
    // For .jsonc files, try to preserve comments and formatting using jsonc-parser
    try {
      // Apply modifications to preserve existing structure
      const editedContent = originalFileContent;
      const modifications: jsonc.Edit[] = [];

      // Generate edit operations for each key in the merged config
      for (const key of Object.keys(mergedConfig)) {
        const path = [key];
        const edits = jsonc.modify(editedContent, path, mergedConfig[key], {
          formattingOptions: { tabSize: 2, insertSpaces: true },
        });
        modifications.push(...edits);
      }

      // Apply all edits
      configContent = jsonc.applyEdits(originalFileContent, modifications);
    } catch (error) {
      // Fallback to standard JSON.stringify if edit fails
      console.log(
        `Error applying JSONC edits: ${error instanceof Error ? error.message : String(error)}`
      );
      console.log('Falling back to JSON.stringify (comments will be lost)');
      configContent = JSON.stringify(mergedConfig, null, 2);
    }
  } else {
    configContent = JSON.stringify(mergedConfig, null, 2);
  }

  fs.writeFileSync(target.path, configContent);
  console.log(`Config written to: ${target.path}`);
  console.log('Config successfully written');
}
