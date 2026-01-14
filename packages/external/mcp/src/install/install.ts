import {
  clientNames,
  readConfig,
  writeConfig,
  getConfigPath,
  getNestedValue,
  setNestedValue,
  type ClientConfig,
} from './client-config';

const command = 'npx';
const args = ['-y', '@x402scan/mcp@latest'];

export function addServer(client: string) {
  if (!clientNames.includes(client)) {
    console.error(
      `Invalid client: ${client}. Available clients: ${clientNames.join(', ')}`
    );
    return;
  }

  if (client === 'warp') {
    console.log('');
    console.info('Warp requires a manual installation through their UI.');
    console.log(
      '  Please copy the following configuration object and add it to your Warp MCP config:\n'
    );
    console.log(
      JSON.stringify(
        {
          x402scan: {
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
    const config = readConfig(client);
    const configPath = getConfigPath(client);
    const configKey = configPath.configKey;

    const serverConfig: ClientConfig = {
      command: 'npx',
      args: ['-y', '@x402scan/mcp@latest'],
    };
    setServerConfig(config, configKey, 'x402scan', serverConfig, client);
    writeConfig(config, client);
  } catch (e) {
    console.error((e as Error).message);
  }
}

// Helper to set a server config in a nested structure
function setServerConfig(
  config: ClientConfig,
  configKey: string,
  serverName: string,
  serverConfig: ClientConfig,
  client: string
): void {
  // Get or create the nested config object
  let servers = getNestedValue(config, configKey);
  if (!servers) {
    setNestedValue(config, configKey, {});
    servers = getNestedValue(config, configKey);
  }

  // Set the server config
  if (servers) {
    if (client === 'goose') {
      // Goose has a different config structure and uses 'envs' instead of 'env'
      servers[serverName] = {
        name: serverName,
        cmd: command,
        args,
        enabled: true,
        envs: {},
        type: 'stdio',
        timeout: 300,
      };
    } else if (client === 'zed') {
      // Zed has a different config structure
      servers[serverName] = {
        source: 'custom',
        command,
        args,
        env: {},
        ...serverConfig, // Allow overriding defaults
      };
    } else if (client === 'opencode') {
      servers[serverName] = {
        type: 'local',
        command,
        args,
        enabled: true,
        environment: {},
      };
    } else {
      servers[serverName] = serverConfig;
    }
  }
}
