/** Stable composite key for a resource: `METHOD::url`. Defaults to GET. */
export function resourceKey(url: string, method?: string): string {
  return `${method ?? 'GET'}::${url}`;
}
