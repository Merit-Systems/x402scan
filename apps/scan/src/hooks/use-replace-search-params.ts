"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { Route } from "next";

export function useReplaceSearchParams() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return useCallback(
    (update: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      update(params);

      const queryString = params.toString();
      // Next's generated Route union cannot represent a dynamic query string.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const href = (
        queryString ? `${pathname}?${queryString}` : pathname
      ) as Route;
      router.replace(href, { scroll: false });
    },
    [pathname, router, searchParams]
  );
}
