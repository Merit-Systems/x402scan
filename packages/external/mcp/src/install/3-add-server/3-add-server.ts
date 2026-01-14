import fs from 'fs';
import path from 'path';

import { log } from '@/lib/log';
import { getClientFileTarget } from './clients/data';

import { Clients } from '../clients';
import { deepMerge, getNestedValue, setNestedValue } from './lib';
import { parseClientConfig, serializeClientConfig } from './file-types';
import { getClientConfigFile } from './client-config-file';

import type { ClientConfigFile, ClientConfigObject } from './types';

const SERVER_NAME = 'x402scan';
const command = 'npx';
const args = ['-y', '@x402scan/mcp@latest'];

export function addServer(client: Clients) {
  if (client === Clients.Warp) {
    console.log('');
    console.info('Warp requires a manual installation through their UI.');
    console.log(
      '  Please copy the following configuration object and add it to your Warp MCP config:\n'
    );
    console.log(
      JSON.stringify(
        {
          [SERVER_NAME]: {
            command,
            args,
            working_directory: null,
            start_on_launch: true,
          },
        },
        null,
        2
      )
    );
    console.log(
      `Read Warp's documentation at https://docs.warp.dev/knowledge-and-collaboration/mcp`
    );
    return;
  }
  console.log(`Installing MCP server ${client}`);

  try {
    const clientFileTarget = getClientConfigFile(client);
    log.info(`Reading config for client: ${client}`);
    const config = readConfig(clientFileTarget);
    log.info(`Read config successfully`);

    log.info(`Writing config for client: ${client}`);
    writeConfig(config, clientFileTarget);
    log.info(`Written config successfully`);
  } catch (e) {
    console.error((e as Error).message);
  }
}

const readConfig = (clientFileTarget: ClientConfigFile) => {
  const defaultConfig: ClientConfigObject = {};
  try {
    log.info(`Checking if config file exists at: ${clientFileTarget.path}`);
    if (!fs.existsSync(clientFileTarget.path)) {
      log.info('Config file not found, returning default empty config');
      setNestedValue(defaultConfig, clientFileTarget.configKey, {});
      return defaultConfig;
    }

    log.info('Reading config file content');
    const rawConfig = parseClientConfig(clientFileTarget);

    log.info(
      `Config loaded successfully: ${JSON.stringify(rawConfig, null, 2)}`
    );

    // Ensure the nested structure exists
    const existingValue = getNestedValue(rawConfig, clientFileTarget.configKey);
    if (!existingValue) {
      setNestedValue(rawConfig, clientFileTarget.configKey, {});
    }

    return rawConfig;
  } catch (error) {
    log.error(
      `Error reading config: ${error instanceof Error ? error.stack : JSON.stringify(error)}`
    );
    const defaultConfig: ClientConfigObject = {};
    setNestedValue(defaultConfig, clientFileTarget.configKey, {});
    return defaultConfig;
  }
};

const writeConfig = (
  config: ClientConfig,
  clientFileTarget: ClientFileTarget
): void => {
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
  let content: string | undefined = undefined;
  setNestedValue(existingConfig, clientFileTarget.configKey, {});

  try {
    if (fs.existsSync(clientFileTarget.path)) {
      const { config, fileContent } = parseClientConfig(clientFileTarget);
      existingConfig = config;
      content = fileContent;

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
    clientFileTarget,
    mergedConfig,
    content
  );

  fs.writeFileSync(clientFileTarget.path, configContent);
};
