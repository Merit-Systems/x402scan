import tseslint from 'typescript-eslint';
import { FlatCompat } from '@eslint/eslintrc';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { baseConfig } from '../eslint.config.base.mjs';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default defineConfig(
  ...baseConfig,
  {
    ignores: [
      'next-env.d.ts',
      'public/**',
      'prisma/generated/**',
      '**/*.d.ts',
      '.trigger/**',
      'eslint.config.mjs',
      'postcss.config.mjs',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  eslintConfigPrettier
);
