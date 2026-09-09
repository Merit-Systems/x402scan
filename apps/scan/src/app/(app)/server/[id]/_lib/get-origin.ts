import "server-only";
import { cache } from "react";

import { z } from "zod";

import { getOrigin } from "@/services/db/resources/origin";

// Share the validated lookup between metadata and the page within one render.
export const getServerOrigin = cache((id: string) =>
  getOrigin(z.uuid().parse(id))
);
