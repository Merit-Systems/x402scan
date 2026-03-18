import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { CURRENCIES } from '@/lib/currencies';

import type { Country, Currency } from '@/types/currency';

interface Props {
  selectedCountry: Country;
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
}

export const CurrencySelect: React.FC<Props> = ({
  selectedCountry,
  selectedCurrency,
  setSelectedCurrency,
}) => {
  const [open, setOpen] = useState(false);

  if (selectedCountry.currencies.length === 1) {
    return <p className="font-semibold">{selectedCountry.currencies[0]}</p>;
  }

  const onClick = (currencyCode: string) => {
    const currency = CURRENCIES.find(
      currency => currency.code === currencyCode
    );
    if (!currency) return;
    setSelectedCurrency(currency);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="font-semibold">
          {selectedCurrency.code}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        {selectedCountry.currencies.map((currencyCode: string) => (
          <Button
            key={currencyCode}
            variant="outline"
            onClick={() => onClick(currencyCode)}
          >
            {currencyCode}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
