import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        allowDefaultProject: ['**/tsup.config.ts'],
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'separate-type-imports',
        },
      ],
      // JSON-domain object types (x402 output schemas, resource metadata)
      // must be `type` aliases: aliases get implicit index signatures, which
      // keeps them assignable to Prisma's structural JSON input types without
      // widening casts at every DB write. Interfaces do not, so the
      // stylisticTypeChecked preset's interface preference is disabled.
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },
  eslintConfigPrettier,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  globalIgnores([
    'dist/**',
    'node_modules/**',
    '*.tsbuildinfo',
    'generated/**',
  ]),
];
