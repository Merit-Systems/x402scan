import { revalidatePath, revalidateTag } from "next/cache";

/** Refresh resource lists and address mappings after successful registration. */
export function revalidateResourceData(originId: string) {
  revalidateTag("resources", "max");
  revalidatePath(`/server/${originId}`);
}
