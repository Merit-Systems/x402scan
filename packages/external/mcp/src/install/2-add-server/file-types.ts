import fs from 'fs';

import * as TOML from '@iarna/toml';
import yaml from 'js-yaml';
import * as jsonc from 'jsonc-parser';

import type { ClientConfigObject, ClientConfigFile } from './types';

export enum FileFormat {
  JSON = 'json',
  YAML = 'yaml',
  TOML = 'toml',
}

/**
 * Parse file content based on format
 */
export const parseClientConfig = ({ format, path }: ClientConfigFile) => {
  const fileContent = fs.readFileSync(path, 'utf8');

  let config: ClientConfigObject = {};
  if (format === FileFormat.YAML) {
    config = yaml.load(fileContent) as ClientConfigObject;
  } else if (format === FileFormat.TOML) {
    config = TOML.parse(fileContent) as ClientConfigObject;
  } else if (path.endsWith('.jsonc')) {
    // Use jsonc-parser for .jsonc files to support comments
    config = jsonc.parse(fileContent) as ClientConfigObject;
  } else {
    // Default to JSON
    config = JSON.parse(fileContent) as ClientConfigObject;
  }

  return {
    config,
    fileContent,
  };
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
    // For .jsonc files, try to preserve comments and formatting using jsonc-parser
    try {
      // Apply modifications to preserve existing structure
      const editedContent = originalContent;
      const modifications: jsonc.Edit[] = [];

      // Generate edit operations for each key in the merged config
      for (const key of Object.keys(config)) {
        const path = [key];
        const edits = jsonc.modify(editedContent, path, config[key], {
          formattingOptions: { tabSize: 2, insertSpaces: true },
        });
        modifications.push(...edits);
      }

      // Apply all edits
      return jsonc.applyEdits(originalContent, modifications);
    } catch (error) {
      // Fallback to standard JSON.stringify if edit fails
      console.log(
        `Error applying JSONC edits: ${error instanceof Error ? error.message : String(error)}`
      );
      console.log('Falling back to JSON.stringify (comments will be lost)');
      return JSON.stringify(config, null, 2);
    }
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
