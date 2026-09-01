"use client";

import { createSortingContext } from "../base/context";

export type ResourceSearchSortId = "filterMatches" | "title";

export const ResourceSearchSortingContext =
  createSortingContext<ResourceSearchSortId>();
