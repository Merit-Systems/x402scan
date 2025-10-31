import tseslint from 'typescript-eslint';
import turboConfig from 'eslint-config-turbo/flat';

// Shared ESLint configuration for all workspaces
export const baseConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      'generated/**',
    ],
  },
  ...turboConfig,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];

export default baseConfig;
