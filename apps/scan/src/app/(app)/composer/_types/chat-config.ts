import z from "zod";

const selectedResourceSchema = z.object({
  id: z.string(),
  favicon: z.string().nullable(),
});
export const selectedResourcesSchema = z.array(selectedResourceSchema);

const chatConfigSchema = z.object({
  model: z.string().optional(),
  resources: selectedResourcesSchema.optional(),
});

export type SelectedResource = z.infer<typeof selectedResourceSchema>;
export type ChatConfig = z.infer<typeof chatConfigSchema>;
