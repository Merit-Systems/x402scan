import { TypesetMdxWrapper, TypesetTable } from "@/components/ui/typeset";

import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    wrapper: TypesetMdxWrapper,
    table: TypesetTable,
    ...components,
  };
}
