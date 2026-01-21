import { config } from '@x402scan/eslint-config/base';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TryStatement',
          message: 'Try/catch is not allowed. Use neverthrow Result types instead.',
        },
      ],
    },
  },
];
