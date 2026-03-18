import { join } from 'path';
import { homedir } from 'os';
import * as fs from 'fs';

const BASE_DIRECTORY = join(homedir(), '.x402scan-mcp');

if (!fs.existsSync(BASE_DIRECTORY)) {
  fs.mkdirSync(BASE_DIRECTORY, { recursive: true });
}

export const configFile = (name: `${string}.${string}`) => {
  if (!fs.existsSync(BASE_DIRECTORY)) {
    fs.mkdirSync(BASE_DIRECTORY, { recursive: true });
  }
  const filePath = join(BASE_DIRECTORY, name);
  return filePath;
};
