// oxfmt-ignore
import "server-only";

import { cache } from "react";

import { createHydrationHelpers } from "@trpc/react-query/rsc";

import { createQueryClient } from "./query-client";
import { createCaller } from "./routers";
import { createTRPCContext } from "./trpc";

import type { AppRouter } from "./routers";
const createContext = cache(createTRPCContext);

const getQueryClient = cache(createQueryClient);
const caller = createCaller(createContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient
);
