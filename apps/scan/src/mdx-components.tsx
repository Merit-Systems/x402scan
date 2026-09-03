import type { MDXComponents } from "mdx/types";

import { TypesetMdxWrapper, TypesetTable } from "@/components/ui/typeset";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    wrapper: TypesetMdxWrapper,
    table: TypesetTable,
    ...components,
  };
}
