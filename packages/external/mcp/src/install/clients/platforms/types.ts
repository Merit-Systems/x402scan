export enum Platforms {
  Windows = 'win32',
  MacOS = 'darwin',
  Linux = 'linux',
}

export interface PlatformPaths {
  baseDir: string;
  vscodePath: string;
}
