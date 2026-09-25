import { Fragment, isValidElement } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

import { toJsxRuntime } from "hast-util-to-jsx-runtime";

import { codeToHast } from "./shiki.bundle";

import type { BundledLanguage, Highlighter } from "./shiki.bundle.ts";

export async function highlight(
  code: string,
  lang: BundledLanguage,
  highlighter?: Highlighter
) {
  const out = highlighter
    ? highlighter.codeToHast(code, {
        lang,
        themes: {
          light: "github-light",
          dark: "github-dark",
        },
      })
    : await codeToHast(code, {
        lang,
        themes: {
          light: "github-light",
          dark: "github-dark",
        },
      });

  const rendered: unknown = toJsxRuntime(out, {
    Fragment,
    jsx,
    jsxs,
  });
  if (!isValidElement(rendered)) {
    throw new Error("Expected highlighted code to render as a React element");
  }
  return rendered;
}
