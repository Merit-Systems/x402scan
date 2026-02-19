'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/ui/currency/currency-input';

import { ProviderSelect } from './providers';
import { ONRAMP_PROVIDERS } from './providers/data';

import { CURRENCIES, UNITED_STATES, US_DOLLAR } from '@/lib/currencies';

import { api } from '@/trpc/client';

import { OnrampProviders } from '@/services/onramp/types';

import type { Dispatch, SetStateAction } from 'react';
import type { Country, Currency } from '@/types/currency';
import type { OnrampMethods } from '@/services/onramp/types';
import type { Address } from 'viem';
import type { DepositSearchParams } from '../../../_lib/params';

interface Props {
  selectedMethod: OnrampMethods;
  setAccordionValue: Dispatch<SetStateAction<string[]>>;
  address: Address;
  searchParams?: DepositSearchParams;
}

export const Onramp: React.FC<Props> = ({
  selectedMethod,
  setAccordionValue,
  address,
  searchParams,
}) => {
  const [amount, setAmount] = useState(5);
  const [selectedCountry, setSelectedCountry] =
    useState<Country>(UNITED_STATES);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(US_DOLLAR);
  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState(0);

  const { data: quotes, isLoading } = api.onramp.quotes.useQuery(
    {
      amount,
      method: selectedMethod,
    },
    {
      enabled: amount > 0,
    }
  );

  const selectedProvider =
    quotes?.[selectedQuoteIndex]?.provider ?? OnrampProviders.STRIPE;
  const selectedProviderMetadata = ONRAMP_PROVIDERS[selectedProvider];

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    const currency = CURRENCIES.find(currency =>
      country.currencies.includes(currency.code)
    );
    if (currency) {
      setSelectedCurrency(currency);
    }
  };

  return (
    <>
      <CurrencyInput
        label="Amount"
        onChange={amount => {
          setAmount(amount);
          setSelectedQuoteIndex(0);
        }}
        selectedCountry={selectedCountry}
        setSelectedCountry={handleSelectCountry}
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
        defaultValue={amount}
      />
      {amount > 0 && (
        <>
          <ProviderSelect
            selectedProvider={selectedProvider}
            setSelectedQuoteIndex={setSelectedQuoteIndex}
            quotes={quotes}
            isLoading={isLoading}
            onClose={() => {
              setAccordionValue(accordionValue =>
                accordionValue.filter(value => value !== 'providers')
              );
            }}
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button>Continue with {selectedProviderMetadata.title}</Button>
            </DialogTrigger>
            <DialogContent
              className="sm:max-w-sm p-0 border-none bg-card"
              showCloseButton={false}
            >
              <DialogHeader className="sr-only">
                <DialogTitle>
                  Continue with {selectedProviderMetadata.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedProviderMetadata.description}
                </DialogDescription>
              </DialogHeader>
              <selectedProviderMetadata.DialogContent
                amount={amount}
                quote={
                  quotes?.find(quote => quote.provider === selectedProvider)
                    ?.quote ?? 0
                }
                address={address}
                searchParams={searchParams}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
};
