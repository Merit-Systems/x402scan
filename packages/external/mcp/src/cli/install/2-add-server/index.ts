import fs from 'fs';

import chalk from 'chalk';

import { log as clackLog, confirm, outro, stream } from '@clack/prompts';

import { safeWriteFile } from '@x402scan/neverthrow/fs';

import { log } from '@/shared/log';

import { clientMetadata, Clients } from '../clients';
import {
  FileFormat,
  parseClientConfig,
  serializeClientConfig,
  stringifyObject,
  getClientConfigFile,
  getNestedValue,
  setNestedValue,
} from './lib';

import { wait } from '@/cli/lib/wait';

import type { ClientConfigObject } from './types';
import type { GlobalFlags } from '@/types';
import { err } from '@x402scan/neverthrow';

const getMcpConfig = (globalFlags: GlobalFlags) => {
  if (globalFlags.dev) {
    return {
      serverName: 'x402',
      command: 'node',
      args: [`${process.cwd()}/dist/index.js`, '--dev'],
    };
  }
  return {
    serverName: 'x402',
    command: 'npx',
    args: ['-y', '@x402scan/mcp@latest'],
  };
};

export async function addServer(client: Clients, globalFlags: GlobalFlags) {
  const { serverName, command, args } = getMcpConfig(globalFlags);

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
          [serverName]: {
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
      return err('config_file', {
        type: 'warp_mcp_server_not_added',
        message: 'Warp MCP server not added',
      });
    }
  }

  const clientFileTarget = getClientConfigFile(client);
  const { name } = clientMetadata[client];

  let config: ClientConfigObject = {};
  let content: string | undefined = undefined;

  log.info(`Checking if config file exists at: ${clientFileTarget.path}`);
  if (!fs.existsSync(clientFileTarget.path)) {
    log.info('Config file not found, creating default empty config');
    setNestedValue(config, clientFileTarget.configKey, {});
    log.info('Config created successfully');
    await wait({
      startText: 'Locating config file',
      stopText: `No config found, creating default empty config`,
      ms: 1000,
    });
  } else {
    log.info('Config file found, reading config file content');
    const parseResult = await parseClientConfig(clientFileTarget);

    if (parseResult.isErr()) {
      clackLog.error(
        chalk.bold.red(`Error reading config: ${parseResult.error.message}`)
      );
      outro(chalk.bold.red(`Error adding x402scan MCP to ${name}`));
      process.exit(1);
    }

    const { config: rawConfig, fileContent } = parseResult.value;
    config = rawConfig;
    content = fileContent;
    const existingValue = getNestedValue(rawConfig, clientFileTarget.configKey);
    if (!existingValue) {
      setNestedValue(rawConfig, clientFileTarget.configKey, {});
    }
    log.info(
      `Config loaded successfully: ${JSON.stringify(rawConfig, null, 2)}`
    );
    await wait({
      startText: `Locating config file`,
      stopText: `Config loaded from ${clientFileTarget.path}`,
      ms: 1000,
    });
  }

  const servers = getNestedValue(config, clientFileTarget.configKey);
  if (!servers || typeof servers !== 'object') {
    log.error(`Invalid ${clientFileTarget.configKey} structure in config`);
    clackLog.error(
      chalk.bold.red(
        `Invalid ${clientFileTarget.configKey} structure in config`
      )
    );
    outro(chalk.bold.red(`Error adding x402scan MCP to ${name}`));
    process.exit(1);
  }

  if (client === Clients.Goose) {
    servers[serverName] = {
      name: serverName,
      cmd: command,
      args,
      enabled: true,
      envs: {},
      type: 'stdio',
      timeout: 300,
    };
  } else if (client === Clients.Zed) {
    // Zed has a different config structure
    servers[serverName] = {
      source: 'custom',
      command,
      args,
      env: {},
    };
  } else if (client === Clients.Opencode) {
    servers[serverName] = {
      type: 'local',
      command,
      args,
      enabled: true,
      environment: {},
    };
  } else {
    servers[serverName] = {
      command,
      args,
    };
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  clackLog.step(
    `The following will be added to ${chalk.bold.underline(clientFileTarget.path)}`
  );

  const configStr = formatDiffByFormat(
    {
      [clientFileTarget.configKey]: {
        [serverName]: servers[serverName] as object,
      },
    },
    clientFileTarget.format
  );

  await stream.message(
    (async function* () {
      for (const num of Array.from({ length: configStr.length }, (_, i) => i)) {
        const char = configStr[num]!;
        yield char;
        if (!['\n', ' ', '─', '╮', '╭', '╰', '╯', '│'].includes(char)) {
          await new Promise(resolve => setTimeout(resolve, 5));
        } else {
          await new Promise(resolve => setTimeout(resolve, 2));
        }
      }
    })()
  );

  await new Promise(resolve => setTimeout(resolve, 1000));

  const isConfirmed = await confirm({
    message: `Would you like to proceed?`,
    active: 'Install MCP',
    inactive: 'Cancel',
  });
  if (isConfirmed !== true) {
    outro(chalk.bold.red('Installation cancelled'));
    process.exit(0);
  }

  const configContent = serializeClientConfig(
    clientFileTarget,
    config,
    content
  );

  const writeResult = await safeWriteFile(
    'config_file',
    clientFileTarget.path,
    configContent
  );

  if (writeResult.isErr()) {
    clackLog.error(
      chalk.bold.red(`Error writing config: ${writeResult.error.message}`)
    );
    outro(chalk.bold.red(`Error adding x402scan MCP to ${name}`));
    process.exit(1);
  }

  clackLog.success(chalk.bold.green(`Added x402scan MCP to ${name}`));
}

const formatDiffByFormat = (obj: object, format: FileFormat) => {
  const str = stringifyObject(obj, format);
  switch (format) {
    case FileFormat.JSON: {
      const numLines = str.split('\n').length;
      return str
        .split('\n')
        .map((line, index) => {
          const diffLines = [0, 1, numLines - 2, numLines - 1];
          const isDiffLine = !diffLines.includes(index);
          if (isDiffLine) {
            return `${chalk.bold.green(`+ ${line.slice(2)}`)}`;
          }
          return line;
        })
        .join('\n');
    }
    case FileFormat.YAML: {
      return str
        .split('\n')
        .map((line, index) => {
          const diffLines = [0, 1, str.length - 2, str.length - 1];
          const isDiffLine = !diffLines.includes(index);
          if (isDiffLine) {
            return `${chalk.bold.green(`+ ${line.slice(2)}`)}`;
          }
          return line;
        })
        .join('\n');
    }
    case FileFormat.TOML: {
      return str
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          return `${chalk.bold.green(`+ ${line.trim()}`)}`;
        })
        .join('\n');
    }
  }
};
