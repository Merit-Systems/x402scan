import fs from 'fs';

import { log } from '@/lib/log';

import { clientMetadata, Clients } from '../clients';
import { getNestedValue, setNestedValue } from './lib';
import { parseClientConfig, serializeClientConfig } from './file-types';
import { getClientConfigFile } from './client-config-file';

import chalk from 'chalk';

import { log as clackLog, confirm } from '@clack/prompts';

import type { ClientConfigObject } from './types';
import boxen from 'boxen';

const SERVER_NAME = 'x402scan';
const command = 'npx';
const args = ['-y', '@x402scan/mcp@latest'];

export async function addServer(client: Clients) {
  if (client === Clients.Warp) {
    clackLog.info(
      chalk.bold.yellow('Warp requires a manual installation through their UI.')
    );
    clackLog.message(
      'Please copy the following configuration object and add it to your Warp MCP config:'
    );
    console.log();
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
    console.log();
    clackLog.message(
      `Read Warp's documentation at https://docs.warp.dev/knowledge-and-collaboration/mcp`
    );
    const addedToWarp = await confirm({
      message: 'Did you add the MCP server to your Warp config?',
    });
    if (!addedToWarp) {
      throw new Error('Warp MCP server not added');
    }
  }

  const clientFileTarget = getClientConfigFile(client);
  let error: string | undefined = undefined;
  const { name } = clientMetadata[client];

  try {
    let config: ClientConfigObject = {};
    let content: string | undefined = undefined;

    log.info(`Checking if config file exists at: ${clientFileTarget.path}`);
    if (!fs.existsSync(clientFileTarget.path)) {
      log.info('Config file not found, creating default empty config');
      setNestedValue(config, clientFileTarget.configKey, {});
      log.info('Config created successfully');
      clackLog.step(
        `No config found at ${clientFileTarget.path}, creating default empty config`
      );
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
      clackLog.step(`Config loaded from ${clientFileTarget.path}`);
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

    const linesToPrint = JSON.stringify(
      {
        [clientFileTarget.configKey]: {
          [SERVER_NAME]: servers[SERVER_NAME] as object,
        },
      },
      null,
      2
    ).split('\n');

    clackLog.step(
      `The following configuration will be added to ${clientFileTarget.path} client:\n\n${boxen(
        JSON.stringify(
          {
            [clientFileTarget.configKey]: {
              [SERVER_NAME]: servers[SERVER_NAME] as object,
            },
          },
          null,
          2
        )
          .split('\n')
          .map((line, index) => {
            const isDiffLine = ![
              0,
              1,
              linesToPrint.length - 2,
              linesToPrint.length - 1,
            ].includes(index);
            if (isDiffLine) {
              return `${chalk.bold.green(`+ ${line.slice(2)}`)}`;
            }
            return line;
          })
          .join('\n'),
        {
          borderStyle: 'round',
          borderColor: 'green',
          title: clientFileTarget.path,
          padding: 1,
        }
      )}`
    );

    const isConfirmed = await confirm({
      message: 'Are you sure you want to update the configuration file?',
    });
    if (!isConfirmed) {
      throw new Error('Configuration file not updated');
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

  if (isError) {
    clackLog.error(chalk.bold.red(`Error adding x402scan MCP to ${name}`));
  } else {
    clackLog.success(chalk.bold.green(`Added x402scan MCP to ${name}`));
  }
  clackLog.message('');
}
