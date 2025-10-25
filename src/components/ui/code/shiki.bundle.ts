/* Generate by @shikijs/codegen */
import type {
  DynamicImportLanguageRegistration,
  DynamicImportThemeRegistration,
  HighlighterGeneric,
} from '@shikijs/types';
import {
  createSingletonShorthands,
  createdBundledHighlighter,
} from '@shikijs/core';
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript';

type BundledLanguage =
  | 'typescript'
  | 'ts'
  | 'javascript'
  | 'js'
  | 'jsx'
  | 'tsx'
  | 'json'
  | 'shell';
type BundledTheme = 'github-light' | 'github-dark';
type Highlighter = HighlighterGeneric<BundledLanguage, BundledTheme>;

const bundledLanguages = {
  typescript: () => import('@shikijs/langs/typescript'),
  ts: () => import('@shikijs/langs/typescript'),
  javascript: () => import('@shikijs/langs/javascript'),
  js: () => import('@shikijs/langs/javascript'),
  jsx: () => import('@shikijs/langs/jsx'),
  tsx: () => import('@shikijs/langs/tsx'),
  shell: () => import('@shikijs/langs/shell'),
  json: () => import('@shikijs/langs/json'),
} as Record<BundledLanguage, DynamicImportLanguageRegistration>;

const bundledThemes = {
  'github-light': () => import('@shikijs/themes/github-light'),
  'github-dark': () => import('@shikijs/themes/github-dark'),
} as Record<BundledTheme, DynamicImportThemeRegistration>;

const createHighlighter = createdBundledHighlighter<
  BundledLanguage,
  BundledTheme
>({
  langs: bundledLanguages,
  themes: bundledThemes,
  engine: () => createJavaScriptRegexEngine(),
});

const { codeToHast } = createSingletonShorthands<BundledLanguage, BundledTheme>(
  createHighlighter
);

export { codeToHast };
export type { BundledLanguage, Highlighter };
