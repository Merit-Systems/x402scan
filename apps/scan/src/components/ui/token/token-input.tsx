'use client';

import React, { useEffect, useRef } from 'react';
import AutoNumeric from 'autonumeric';
import { Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { Loading } from '@/components/ui/loading';

import { TokenSelect } from './token-select';

import { useBalance } from '@/app/_hooks/use-balance';

import { cn } from '@/lib/utils';
import { BASE_USDC } from '@/lib/tokens/usdc';

import type { Token } from '@/types/token';

interface Props
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange: (value: number) => void;
  label: string;
  selectedToken: Token;
  onTokenChange?: (token: Token) => void;
  tokens?: Token[];
  className?: string;
  inputClassName?: string;
  isBalanceMax?: boolean;
}

export const TokenInput: React.FC<Props> = ({
  onChange,
  selectedToken = BASE_USDC,
  onTokenChange,
  tokens = [],
  isBalanceMax = false,
  label,
  className,
  inputClassName,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autoNumericRef = useRef<AutoNumeric | null>(null);

  const { data: balance, isLoading: isBalanceLoading } = useBalance(
    selectedToken,
    {
      enabled: isBalanceMax,
    }
  );

  useEffect(() => {
    if (inputRef.current) {
      const maximumValue =
        balance && Number(balance) > 0
          ? balance.toString()
          : '99999999999999.99';

      autoNumericRef.current = new AutoNumeric(inputRef.current, {
        digitGroupSeparator: '',
        decimalCharacter: '.',
        decimalPlaces: selectedToken.decimals ?? 6,
        currencySymbol: '',
        minimumValue: '0',
        maximumValue,
        modifyValueOnWheel: false,
        formatOnPageLoad: true,
        unformatOnSubmit: true,
        watchExternalChanges: true,
        emptyInputBehavior: 'zero',
        overrideMinMaxLimits: 'invalid',
        allowDecimalPadding: false,
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
  }, [onChange, balance, selectedToken.decimals]);

  const handlePercentageClick = (percentage: number) => {
    if (inputRef.current && balance) {
      const amount = (Number(balance) * percentage) / 100;
      autoNumericRef.current?.set(amount);
      onChange(amount);
    }
  };

  return (
    <div
      className={cn(
        'border-border bg-card/50 flex flex-col gap-3 rounded-xl border-2 p-3 transition-all duration-200',
        'focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-[3px]',
        className
      )}
    >
      <span className="text-muted-foreground text-sm font-medium">{label}</span>

      <div className="flex items-center gap-3">
        {/* Amount input */}
        <Input
          {...props}
          ref={inputRef}
          type="text"
          placeholder="0"
          className={cn(
            'h-fit w-full border-none bg-transparent p-0 text-xl md:text-2xl font-medium shadow-none ring-0 rounded-none leading-none',
            'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none',
            inputClassName
          )}
        />

        {/* Token selector */}
        <TokenSelect
          selectedToken={selectedToken}
          tokens={tokens}
          onTokenChange={onTokenChange}
        />
      </div>
      {isBalanceMax && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {[25, 50, 75].map(percent => (
              <Button
                key={percent}
                variant="ghost"
                size="xs"
                className="size-fit px-1 text-xs"
                onClick={() => handlePercentageClick(percent)}
                disabled={!balance || props.disabled}
              >
                {percent}%
              </Button>
            ))}
            <Button
              variant="ghost"
              size="xs"
              className="size-fit px-1 text-xs"
              onClick={() => handlePercentageClick(100)}
              disabled={!balance || props.disabled}
            >
              Max
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="size-3 text-muted-foreground" />
            <Loading
              value={balance}
              isLoading={isBalanceLoading}
              component={value => (
                <div className="text-muted-foreground flex items-center justify-end text-xs">
                  <span>
                    {value} {selectedToken.symbol}
                  </span>
                </div>
              )}
              loadingComponent={<Skeleton className="h-4 w-16" />}
            />
          </div>
        </div>
      )}
    </div>
  );
};
