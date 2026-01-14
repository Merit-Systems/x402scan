import os from 'os';
import path from 'path';
import process from 'process';
import z from 'zod';

import { PlatformPaths, Platforms } from './types';

export const getPlatformPath = (): PlatformPaths => {
  const platform = z.enum(Platforms).safeParse(process.platform);
  if (!platform.success) {
    throw new Error(`Invalid platform: ${process.platform}`);
  }

  const homeDir = os.homedir();

  switch (platform.data) {
    case Platforms.Windows:
      return {
        baseDir:
          process.env.APPDATA ?? path.join(homeDir, 'AppData', 'Roaming'),
        vscodePath: path.join('Code', 'User'),
      };
    case Platforms.MacOS:
      return {
        baseDir: path.join(homeDir, 'Library', 'Application Support'),
        vscodePath: path.join('Code', 'User'),
      };
    case Platforms.Linux:
      return {
        baseDir: process.env.XDG_CONFIG_HOME ?? path.join(homeDir, '.config'),
        vscodePath: path.join('Code/User'),
      };
    default:
      throw new Error(`Invalid platform: ${process.platform}`);
  }
};
