import { revalidatePath } from "next/cache";

import { invalidateQueryCacheTag } from "@/lib/cache/query";

/** Refresh resource lists and address mappings after successful registration. */
export async function revalidateResourceData(originId: string) {
  await invalidateQueryCacheTag("resources");
  revalidatePath(`/server/${originId}`);
}
