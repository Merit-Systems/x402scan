import fs from 'fs';

import { formatConsoleLog, ConsoleLog, log } from '@/lib/log';

import { clientMetadata, Clients } from '../clients';
import { getNestedValue, setNestedValue } from './lib';
import { parseClientConfig, serializeClientConfig } from './file-types';
import { getClientConfigFile } from './client-config-file';

import type { ClientConfigObject } from './types';
import boxen from 'boxen';
import chalk from 'chalk';
import consola from 'consola';

const SERVER_NAME = 'x402scann';
const command = 'npx';
const args = ['-y', '@x402scan/mcp@latest'];

export function addServer(client: Clients) {
  if (client === Clients.Warp) {
    consola.info(
      chalk.bold.yellow('Warp requires a manual installation through their UI.')
    );
    console.log();
    consola.log(
      '  Please copy the following configuration object and add it to your Warp MCP config:\n'
    );
    console.log(
      boxen(
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
        ),
        {
          borderStyle: 'round',
          borderColor: '#2563eb',
          title: chalk.bold('Warp MCP'),
          padding: 1,
        }
      )
    );
    console.log();
    console.log(
      `Read Warp's documentation at https://docs.warp.dev/knowledge-and-collaboration/mcp`
    );
    return;
  }

  const clientFileTarget = getClientConfigFile(client);
  const error: string | undefined = undefined;

  try {
    let config: ClientConfigObject = {};
    let content: string | undefined = undefined;

    log.info(`Checking if config file exists at: ${clientFileTarget.path}`);
    if (!fs.existsSync(clientFileTarget.path)) {
      log.info('Config file not found, creating default empty config');
      setNestedValue(config, clientFileTarget.configKey, {});
      log.info('Config created successfully');
    } else {
      log.info('Config file found, reading config file content');
      const { config: rawConfig, fileContent } =
        parseClientConfig(clientFileTarget);
      config = rawConfig;
      content = fileContent;
      const existingValue = getNestedValue(
        rawConfig,
        clientFileTarget.configKey
      );
      if (!existingValue) {
        setNestedValue(rawConfig, clientFileTarget.configKey, {});
      }
      log.info(
        `Config loaded successfully: ${JSON.stringify(rawConfig, null, 2)}`
      );
    }

    const servers = getNestedValue(config, clientFileTarget.configKey);
    if (!servers || typeof servers !== 'object') {
      log.error(`Invalid ${clientFileTarget.configKey} structure in config`);
      throw new Error(`Invalid ${clientFileTarget.configKey} structure`);
    }

    if (client === Clients.Goose) {
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
        command,
        args,
        env: {},
      };
    } else if (client === Clients.Opencode) {
      servers[SERVER_NAME] = {
        type: 'local',
        command,
        args,
        enabled: true,
        environment: {},
      };
    } else {
      servers[SERVER_NAME] = {
        command,
        args,
      };
    }

    const configContent = serializeClientConfig(
      clientFileTarget,
      config,
      content
    );

    fs.writeFileSync(clientFileTarget.path, configContent);
  } catch (e) {
    error = (e as Error).message;
    throw e;
  }

  const isError = error !== undefined;
  const { name } = clientMetadata[client];

  console.log(
    boxen(`Configuration added to ${clientFileTarget.path}`, {
      borderStyle: 'round',
      borderColor: isError ? 'red' : 'green',
      title: chalk.bold(
        isError
          ? `Error adding x402scan MCP to ${name}`
          : `Added x402scan MCP to ${name}`
      ),
      padding: 1,
    })
  );
  console.log();
}
