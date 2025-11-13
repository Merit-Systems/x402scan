import { config as baseConfig } from './base.js';
import { globalIgnores } from 'eslint/config';

/**
 * A shared ESLint configuration for Trigger.dev projects.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const triggerConfig = [...baseConfig, globalIgnores(['generated/**'])];
