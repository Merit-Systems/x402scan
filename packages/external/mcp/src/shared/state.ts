import z from 'zod';
import fs from 'fs';

import { configFile } from './fs';

const STATE_FILE = configFile('state.json');

const stateSchema = z
  .looseObject({
    redeemedCodes: z.array(z.string()),
  })
  .partial();

export const getState = () => {
  const stateFileExists = fs.existsSync(STATE_FILE);
  if (!stateFileExists) {
    fs.writeFileSync(STATE_FILE, '{}');
    return {};
  }

  const stateFileContent = fs.readFileSync(STATE_FILE, 'utf-8');
  const result = stateSchema.safeParse(JSON.parse(stateFileContent));
  if (!result.success) {
    return {};
  }
  return result.data;
};

export const setState = (state: z.infer<typeof stateSchema>) => {
  const existing = getState();
  const newState = stateSchema.parse({ ...existing, ...state });
  fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));
};
