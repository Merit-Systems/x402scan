'use client';

import React, { useCallback, useState, forwardRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { cn } from '@/lib/utils';

import { CheckIcon, Globe } from 'lucide-react';
import { CircleFlag } from 'react-circle-flags';

import { COUNTRIES } from '@/lib/currencies';

import type { Country } from '@/types/currency';

interface CountryDropdownProps {
  options?: Country[];
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;
  defaultValue?: Country;
  disabled?: boolean;
  placeholder?: string;
  slim?: boolean;
}

const CountrySelectComponent = (
  {
    options = COUNTRIES,
    selectedCountry,
    setSelectedCountry,
    defaultValue,
    disabled = false,
    ...props
  }: CountryDropdownProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (defaultValue) {
      const initialCountry = options.find(
        country => country.alpha2 === defaultValue.alpha2
      );
      if (initialCountry) {
        setSelectedCountry(initialCountry);
      }
    }
  }, [defaultValue, options, setSelectedCountry]);

  const handleSelect = useCallback(
    (country: Country) => {
      setSelectedCountry(country);
      setOpen(false);
    },
    [setSelectedCountry]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger ref={ref} disabled={disabled} {...props} asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-fit md:size-fit rounded-full p-0.5 md:p-0.5"
        >
          {selectedCountry ? (
            <CircleFlag
              countryCode={selectedCountry.alpha2.toLowerCase()}
              height={16}
              className="size-5"
            />
          ) : (
            <Globe className="size-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        collisionPadding={10}
        side="bottom"
        className="min-w-[--radix-popper-anchor-width] p-0"
      >
        <Command className="w-full max-h-[200px] sm:max-h-[270px]">
          <CommandList>
            <div className="sticky top-0 z-10 bg-popover">
              <CommandInput placeholder="Search country..." />
            </div>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {options
                .filter(x => x.name)
                .map((option, key: number) => (
                  <CommandItem
                    className="flex items-center w-full gap-2"
                    key={key}
                    onSelect={() => handleSelect(option)}
                  >
                    <div className="flex grow w-0 space-x-2 overflow-hidden">
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {option.name}
                      </span>
                    </div>
                    <CheckIcon
                      className={cn(
                        'ml-auto h-4 w-4 shrink-0',
                        option.name === selectedCountry?.name
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

CountrySelectComponent.displayName = 'CountrySelectComponent';

export const CountrySelect = forwardRef(CountrySelectComponent);
