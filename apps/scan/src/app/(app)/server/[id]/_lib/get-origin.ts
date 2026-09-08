import "server-only";
import { cache } from "react";

import { api } from "@/trpc/server";

// Share the validated lookup between metadata and the page within one render.
export const getServerOrigin = cache((id: string) =>
  api.public.origins.get(id)
);
