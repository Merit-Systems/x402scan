import z from 'zod';
import fs from 'fs';

import { configFile } from './fs';

const STATE_FILE = configFile('state.json');

const stateSchema = z
  .object({
    redeemedCodes: z.array(z.string()),
  })
  .partial();

export const getState = () => {
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, '{}');
    return stateSchema.parse({});
  }
  return stateSchema.parse(JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')));
};

export const setState = (state: z.infer<typeof stateSchema>) => {
  const existing = getState();
  const newState = stateSchema.parse({ ...existing, ...state });
  fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));
};
