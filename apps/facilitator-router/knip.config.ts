import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  project: ['src/**/*.ts'],
  ignore: [
    'dist/**',
    'node_modules/**',
    '**/*.d.ts'
  ],
  ignoreBinaries: [],
  ignoreDependencies: [],
  ignoreExportsUsedInFile: true,
  includeEntryExports: false,
  tsup: {
    config: 'tsup.config.ts'
  }
};

export default config;
