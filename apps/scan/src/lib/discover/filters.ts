import { z } from "zod";

type SearchParamValue = string | string[] | undefined;
const pageParamSchema = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().positive());

export const SERVICES_PAGE_SIZE = 15;

const serviceViewSchema = z.enum(["featured", "all"]);
export type ServiceView = z.infer<typeof serviceViewSchema>;
export const DEFAULT_SERVICE_VIEW: ServiceView = "featured";

export function parseServiceView(raw: SearchParamValue): ServiceView {
  const parsed = serviceViewSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_SERVICE_VIEW;
}

export function parseDiscoverPage(raw: SearchParamValue): number {
  const parsed = pageParamSchema.safeParse(raw);
  return parsed.success ? parsed.data - 1 : 0;
}

export function formatDiscoverPage(page: number): string | null {
  return page > 0 ? (page + 1).toString() : null;
}
