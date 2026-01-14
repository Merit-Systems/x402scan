import fs from 'fs';
import path from 'path';

import { Clients } from '../clients';
import type { ClientConfigObject } from './types';
import { log } from '@/lib/log';
import { getClientConfigFile } from './client-config-file';
import { parseClientConfig, serializeClientConfig } from './file-types';
import { getNestedValue, setNestedValue, deepMerge } from './lib';

export function readConfig(client: Clients): ClientConfigObject {
  log.info(`Reading config for client: ${client}`);
  try {
    const clientFileTarget = getClientConfigFile(client);

    log.info(`Checking if config file exists at: ${clientFileTarget.path}`);
    if (!fs.existsSync(clientFileTarget.path)) {
      log.info('Config file not found, returning default empty config');
      const defaultConfig: ClientConfigObject = {};
      setNestedValue(defaultConfig, clientFileTarget.configKey, {});
      return defaultConfig;
    }

    log.info('Reading config file content');
    const rawConfig = parseClientConfig(clientFileTarget);

    log.info(
      `Config loaded successfully: ${JSON.stringify(rawConfig, null, 2)}`
    );

    // Ensure the nested structure exists
    const existingValue = getNestedValue(
      rawConfig.config,
      clientFileTarget.configKey
    );
    if (!existingValue) {
      setNestedValue(rawConfig.config, clientFileTarget.configKey, {});
    }

    return rawConfig;
  } catch (error) {
    log.error(
      `Error reading config: ${error instanceof Error ? error.stack : JSON.stringify(error)}`
    );
    const configPath = getClientConfigFile(client);
    const defaultConfig: ClientConfigObject = {};
    setNestedValue(defaultConfig, configPath.configKey, {});
    return defaultConfig;
  }
}

export function writeConfig(config: ClientConfigObject, client: Clients): void {
  log.info(`Writing config for client: ${client}`);
  log.info(`Config data: ${JSON.stringify(config, null, 2)}`);

  const clientFileTarget = getClientConfigFile(client);

  const servers = getNestedValue(config, clientFileTarget.configKey);
  if (!servers || typeof servers !== 'object') {
    console.log(`Invalid ${clientFileTarget.configKey} structure in config`);
    throw new Error(`Invalid ${clientFileTarget.configKey} structure`);
  }

  const configDir = path.dirname(clientFileTarget.path);

  log.info(`Ensuring config directory exists: ${configDir}`);
  if (!fs.existsSync(configDir)) {
    log.info(`Creating directory: ${configDir}`);
    fs.mkdirSync(configDir, { recursive: true });
  }

  let existingConfig: ClientConfig = {};
  setNestedValue(existingConfig, clientFileTarget.configKey, {});

  try {
    if (fs.existsSync(clientFileTarget.path)) {
      existingConfig = parseClientConfig(clientFileTarget);

      log.info(
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

  log.info(`Writing config to file: ${clientFileTarget.path}`);

  const configContent = serializeConfig(
    mergedConfig,
    target.format,
    target.path,
    originalFileContent
  );

  fs.writeFileSync(target.path, configContent);
  console.log(`Config written to: ${target.path}`);
  console.log('Config successfully written');
}

// Helper to set a server config in a nested structure
function setServerConfig(client: Clients, config: ClientConfig) {
  const clientFileTarget = getClientConfigFile(client);

  let servers = getNestedValue(config, configKey);
  if (!servers) {
    setNestedValue(config, configKey, {});
    servers = getNestedValue(config, configKey);
  }

  // Set the server config
  if (servers) {
    if (client === Clients.Goose) {
      // Goose has a different config structure and uses 'envs' instead of 'env'
      servers[SERVER_NAME] = {
        name: SERVER_NAME,
        cmd: command,
        args,
        enabled: true,
        envs: {},
        type: 'stdio',
        timeout: 300,
      };
    } else if (client === Clients.Zed) {
      // Zed has a different config structure
      servers[SERVER_NAME] = {
        source: 'custom',
        env: {},
        ...serverConfig, // Allow overriding defaults
      };
    } else if (client === Clients.Opencode) {
      servers[SERVER_NAME] = {
        type: 'local',
        enabled: true,
        environment: {},
        ...serverConfig,
      };
    } else {
      servers[SERVER_NAME] = serverConfig;
    }
  }
}
