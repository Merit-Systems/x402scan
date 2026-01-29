import z from 'zod';
import fs from 'fs';

import { configFile } from './fs';
import { DEFAULT_ORIGINS } from './origins';

const STATE_FILE = configFile('state.json');

const stateSchema = z.looseObject({
  redeemedCodes: z.array(z.string()).default([]),
  origins: z.array(z.string()).default(DEFAULT_ORIGINS),
});

const defaultState = {
  redeemedCodes: [],
  origins: DEFAULT_ORIGINS,
};

export const getState = () => {
  const stateFileExists = fs.existsSync(STATE_FILE);
  if (!stateFileExists) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(defaultState, null, 2));
    return defaultState;
  }

  const stateFileContent = fs.readFileSync(STATE_FILE, 'utf-8');
  const result = stateSchema.safeParse(JSON.parse(stateFileContent));
  if (!result.success) {
    return defaultState;
  }
  return result.data;
};

export const setState = (state: Partial<z.infer<typeof stateSchema>>) => {
  const existing = getState();
  const newState = stateSchema.parse({ ...existing, ...state });
  fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));
};

export const addOrigin = (origin: string) => {
  const state = getState();
  setState({ origins: [...state.origins, origin] });
};
