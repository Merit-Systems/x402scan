import z from 'zod';
import fs from 'fs';

import { configFile } from './fs';
import { log } from './log';

const STATE_FILE = configFile('state.json');

const stateSchema = z
  .looseObject({
    redeemedCodes: z.array(z.string()),
  })
  .partial();

export const getState = () => {
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({}));
    return {};
  }
  const result = stateSchema.safeParse(
    JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
  );
  if (!result.success) {
    log.error('Failed to parse state', { error: result.error });
    return {};
  }
  return result.data;
};

export const setState = (state: z.infer<typeof stateSchema>) => {
  const existing = getState();
  const newState = stateSchema.parse({ ...existing, ...state });
  fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));
};
