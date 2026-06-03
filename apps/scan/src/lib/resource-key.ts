/** Stable composite key for a resource: `METHOD::url`. */
export function resourceKey(url: string, method?: string): string {
  return method ? `${method}::${url}` : url;
}
