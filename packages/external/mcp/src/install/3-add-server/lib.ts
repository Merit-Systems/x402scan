import { ClientConfigObject } from './types';

export const getNestedValue = (obj: ClientConfigObject, path: string) => {
  const keys = path.split('.');
  let current: ClientConfigObject | undefined = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key] as ClientConfigObject;
    } else {
      return undefined;
    }
  }
  return current;
};

export const setNestedValue = (
  obj: ClientConfigObject,
  path: string,
  value: ClientConfigObject
) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  if (!lastKey) return;
  const target = keys.reduce((current, key) => {
    current[key] ??= {};
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return current[key];
  }, obj);
  target[lastKey] = value;
};

export const deepMerge = (
  target: ClientConfigObject,
  source: ClientConfigObject
) => {
  const result: ClientConfigObject = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      result[key] = deepMerge(
        result[key] ?? {},
        source[key] as ClientConfigObject
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      result[key] = source[key];
    }
  }

  return result;
};
