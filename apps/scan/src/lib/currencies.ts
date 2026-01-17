import { countries, currencies } from 'country-data-list';

export const COUNTRIES = countries.all.filter(
  country =>
    country.emoji &&
    country.status !== 'deleted' &&
    country.ioc !== 'PRK' &&
    country.currencies.length > 0
);
export const CURRENCIES = currencies.all.filter(
  currency => currency.code !== 'PRK'
);

export const UNITED_STATES = COUNTRIES[237]!;
export const US_DOLLAR = CURRENCIES[149]!;
