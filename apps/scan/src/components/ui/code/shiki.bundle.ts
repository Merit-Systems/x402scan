/* Generate by @shikijs/codegen */
import type {
  DynamicImportLanguageRegistration,
  DynamicImportThemeRegistration,
  HighlighterGeneric,
} from 'shiki';
import {
  createSingletonShorthands,
  createdBundledHighlighter,
  createJavaScriptRegexEngine,
} from 'shiki';

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
  typescript: () => import('shiki/langs/typescript.mjs'),
  ts: () => import('shiki/langs/typescript.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  js: () => import('shiki/langs/javascript.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  shell: () => import('shiki/langs/shell.mjs'),
  json: () => import('shiki/langs/json.mjs'),
} as Record<BundledLanguage, DynamicImportLanguageRegistration>;

const bundledThemes = {
  'github-light': () => import('shiki/themes/github-light.mjs'),
  'github-dark': () => import('shiki/themes/github-dark.mjs'),
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
