import type { NavItem, NavPage, NavSection } from './mdx';

interface PageLocation {
  page: NavPage;
  section?: NavSection;
  index: number;
  total: number;
}

// Recursively find a page in the navigation tree and return its location
export const findPageLocation = (
  items: NavItem[],
  path: string[],
  currentSection?: NavSection
): PageLocation | null => {
  if (path.length === 0) return null;

  const [current, ...rest] = path;
  const item = items.find(i => i.slug === current);

  if (!item) return null;

  if (rest.length === 0) {
    // We've reached the end of the path - it should be a page
    if (item.type !== 'page') return null;

    const allPages = collectPages(items);
    const index = allPages.findIndex(p => p.slug === item.slug);

    return {
      page: item,
      section: currentSection,
      index,
      total: allPages.length,
    };
  }

  // More path segments remain - current must be a section
  if (item.type !== 'section') return null;

  return findPageLocation(item.items, rest, item);
};

// Check if a path exists as a valid page in the navigation tree
export const isValidPagePath = (items: NavItem[], path: string[]): boolean => {
  return findPageLocation(items, path) !== null;
};

// Recursively collect all pages from the navigation tree (flattened)
const collectPages = (items: NavItem[]): NavPage[] => {
  return items.flatMap(item => {
    if (item.type === 'page') {
      return [item];
    } else {
      return collectPages(item.items);
    }
  });
};

// Recursively collect all page paths from the navigation tree
export const collectPagePaths = (
  items: NavItem[],
  prefix: string[] = []
): string[][] => {
  return items.flatMap(item => {
    const currentPath = [...prefix, item.slug];
    if (item.type === 'page') {
      return [currentPath];
    } else {
      return collectPagePaths(item.items, currentPath);
    }
  });
};
