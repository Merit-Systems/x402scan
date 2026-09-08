// Pure SQL-fragment builder, deliberately dependency-free: importing anything
// from ./list-mv (even a pure export) transitively constructs the app's live
// Prisma/neon/redis clients at module-load time, which makes it untestable in
// isolation. Keep this file free of those imports so it stays unit-testable.
export const buildSellersOrderByColumn = (sorting: {
  id: string;
  desc: boolean;
}): string =>
  `"${sorting.id === 'editorial' ? 'recipient' : sorting.id}" ${
    sorting.id !== 'editorial' && sorting.desc ? 'DESC' : 'ASC'
  }${sorting.id === 'editorial' ? '' : ', recipient ASC'}`;
