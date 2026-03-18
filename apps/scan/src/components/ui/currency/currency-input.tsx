'use client';

import React, { useEffect, useRef } from 'react';

import AutoNumeric from 'autonumeric';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { CountrySelect } from './country-select';

import { COUNTRIES } from '@/lib/currencies';

import { cn } from '@/lib/utils';

import type { Country, Currency } from '@/types/currency';

import { getSymbolFromCurrency } from 'country-data-list/data/currency-symbol';
import { CurrencySelect } from './currency-select';

interface Props extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange'
> {
  onChange: (value: number) => void;
  label: string | React.ReactNode;
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;
  countries?: Country[];
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  className?: string;
  inputClassName?: string;
}

export const CurrencyInput: React.FC<Props> = ({
  onChange,
  selectedCountry,
  setSelectedCountry,
  countries = COUNTRIES,
  selectedCurrency,
  setSelectedCurrency,
  label,
  className,
  inputClassName,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autoNumericRef = useRef<AutoNumeric | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      autoNumericRef.current = new AutoNumeric(inputRef.current, {
        digitGroupSeparator: '',
        decimalCharacter: '.',
        decimalPlaces: selectedCurrency?.decimals ?? 2,
        currencySymbol: selectedCurrency
          ? getSymbolFromCurrency(selectedCurrency.code)
          : '',
        minimumValue: '0',
        modifyValueOnWheel: false,
        formatOnPageLoad: true,
        unformatOnSubmit: true,
        watchExternalChanges: true,
        emptyInputBehavior: 'zero',
        overrideMinMaxLimits: 'invalid',
        currencySymbolPlacement: 'p',
      });

      // Add event listener for value changes
      inputRef.current.addEventListener('autoNumeric:formatted', () => {
        const numericValue = autoNumericRef.current?.getNumber() ?? 0;
        onChange(numericValue);
      });
    }

    return () => {
      if (autoNumericRef.current) {
        autoNumericRef.current.remove();
      }
    };
  }, [onChange, selectedCurrency]);

  return (
    <Card
      className={cn(
        'flex flex-col gap-3 p-3 transition-all duration-200',
        'focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-[3px]',
        className
      )}
    >
      {typeof label === 'string' ? (
        <span className="text-muted-foreground text-sm font-medium">
          {label}
        </span>
      ) : (
        label
      )}

      <div className="flex items-center gap-3">
        {/* Amount input */}
        <Input
          {...props}
          ref={inputRef}
          type="text"
          placeholder="0"
          className={cn(
            'h-fit flex-1 border-none bg-transparent p-0 text-xl md:text-2xl font-medium shadow-none ring-0 rounded-none leading-none',
            'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none',
            inputClassName
          )}
        />

        {/* Token selector */}
        <div className="flex items-center gap-1.5">
          <CountrySelect
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            options={countries}
          />
          <CurrencySelect
            selectedCountry={selectedCountry}
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
          />
        </div>
      </div>
    </Card>
  );
};
