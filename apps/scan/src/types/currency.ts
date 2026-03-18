import type { countries, currencies } from 'country-data-list';

export type Country = (typeof countries.all)[number];
export type Currency = (typeof currencies.all)[number];
