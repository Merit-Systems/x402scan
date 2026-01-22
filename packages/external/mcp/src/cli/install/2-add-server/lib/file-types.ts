import * as TOML from '@iarna/toml';
import yaml from 'js-yaml';
import * as jsonc from 'jsonc-parser';

import { safeReadFile } from '@x402scan/neverthrow/fs';
import { configResultFromThrowable } from './result';

import type { ClientConfigFile, ClientConfigObject } from '../types';

export enum FileFormat {
  JSON = 'json',
  YAML = 'yaml',
  TOML = 'toml',
}

const parseContent = (
  fileContent: string,
  format: FileFormat,
  path: string
) => {
  return configResultFromThrowable(
    () => {
      let config: ClientConfigObject;
      if (format === FileFormat.YAML) {
        config = yaml.load(fileContent) as ClientConfigObject;
      } else if (format === FileFormat.TOML) {
        config = TOML.parse(fileContent) as ClientConfigObject;
      } else if (path.endsWith('.jsonc')) {
        config = jsonc.parse(fileContent) as ClientConfigObject;
      } else {
        config = JSON.parse(fileContent) as ClientConfigObject;
      }
      return {
        config,
        fileContent,
      };
    },
    e => ({
      type: 'parse_config',
      message: e instanceof Error ? e.message : 'Failed to parse config file',
    })
  );
};

/**
 * Parse file content based on format
 */
export const parseClientConfig = async ({ format, path }: ClientConfigFile) => {
  const readResult = await safeReadFile('config_file', path);

  if (readResult.isErr()) return readResult;

  const parseResult = parseContent(readResult.value, format, path);

  if (parseResult.isErr()) return parseResult;

  return parseResult;
};

const serializeJsonc = (
  config: ClientConfigObject,
  originalContent: string
) => {
  return configResultFromThrowable<string>(
    () => {
      const modifications: jsonc.Edit[] = [];

      for (const key of Object.keys(config)) {
        const keyPath = [key];
        const edits = jsonc.modify(originalContent, keyPath, config[key], {
          formattingOptions: { tabSize: 2, insertSpaces: true },
        });
        modifications.push(...edits);
      }

      return jsonc.applyEdits(originalContent, modifications);
    },
    e => ({
      type: 'serialize_config',
      message: e instanceof Error ? e.message : 'Failed to serialize JSONC',
    })
  );
};

export const serializeClientConfig = (
  { format, path }: ClientConfigFile,
  config: ClientConfigObject,
  originalContent?: string
): string => {
  if (format === FileFormat.YAML) {
    return yaml.dump(config, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    });
  }
  if (format === FileFormat.TOML) {
    return TOML.stringify(config);
  }
  if (path.endsWith('.jsonc') && originalContent) {
    const result = serializeJsonc(config, originalContent);
    if (result.isOk()) {
      return result.value;
    }
    // Fallback to standard JSON.stringify if edit fails
    console.log(`Error applying JSONC edits: ${result.error.message}`);
    console.log('Falling back to JSON.stringify (comments will be lost)');
    return JSON.stringify(config, null, 2);
  }
  // Default to JSON
  return JSON.stringify(config, null, 2);
};

export const stringifyObject = (
  config: ClientConfigObject,
  format: FileFormat
) => {
  if (format === FileFormat.YAML) {
    return yaml.dump(config, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    });
  }
  if (format === FileFormat.TOML) {
    return TOML.stringify(config);
  }
  return JSON.stringify(config, null, 2);
};
