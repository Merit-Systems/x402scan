import { config } from '@x402scan/eslint-config/base';
import { globalIgnores } from 'eslint/config';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TryStatement',
          message:
            'Try/catch is not allowed. Use neverthrow Result types instead.',
        },
      ],
    },
  },
  globalIgnores(['evals/**']),
];
