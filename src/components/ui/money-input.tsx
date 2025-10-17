import React, { useEffect, useRef } from 'react';

import AutoNumeric from 'autonumeric';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';

import { useBalance } from '@/app/_hooks/use-balance';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  setAmount: (amount: number) => void;
  address?: string;
  initialAmount?: number;
  placeholder?: string;
  prefixClassName?: string;
  className?: string;
  inputClassName?: string;
  isBalanceMax?: boolean;
  showMaxButton?: boolean;
  hideDollarSign?: boolean;
  decimalPlaces?: number;
}

export const MoneyInput: React.FC<Props> = ({
  setAmount,
  initialAmount,
  placeholder,
  className,
  inputClassName,
  prefixClassName,
  isBalanceMax,
  showMaxButton,
  hideDollarSign,
  decimalPlaces = 2,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autoNumericRef = useRef<AutoNumeric | null>(null);

  const { data: balance, isLoading: isBalanceLoading } = useBalance();

  useEffect(() => {
    if (inputRef.current) {
      const minimumValue = '0.000001';
      const maximumValue =
        isBalanceMax && balance && Number(balance) > 0
          ? balance.toString()
          : '99999999999999.99';

      autoNumericRef.current = new AutoNumeric(inputRef.current, {
        digitGroupSeparator: ',',
        decimalCharacter: '.',
        decimalPlaces,
        currencySymbol: '',
        minimumValue,
        maximumValue,
        modifyValueOnWheel: false,
        formatOnPageLoad: true,
        unformatOnSubmit: true,
        watchExternalChanges: true,
        emptyInputBehavior: 'focus',
        overrideMinMaxLimits: 'invalid',
        allowDecimalPadding: false,
      });

      // Add event listener for value changes
      inputRef.current.addEventListener('autoNumeric:formatted', () => {
        const value = autoNumericRef.current?.getNumber() ?? 0;
        setAmount(value);
      });
    }

    return () => {
      if (autoNumericRef.current) {
        autoNumericRef.current.remove();
      }
    };
  }, [setAmount, balance, isBalanceMax, decimalPlaces]);

  return (
    <div
      className={cn(
        'border-border bg-card flex h-fit flex-row items-center overflow-hidden rounded-md border-2 pr-1 transition-colors duration-200',
        'focus-within:border-ring/80 focus-within:ring-ring/50 focus-within:ring-[3px]',
        className
      )}
    >
      <div
        className={cn(
          'bg-foreground/10 flex aspect-square size-10 h-full items-center justify-center text-lg opacity-60 shrink-0',
          prefixClassName,
          hideDollarSign && 'hidden'
        )}
      >
        $
      </div>
      <Input
        {...props}
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className={cn(
          'h-fit w-full [appearance:textfield] border-none bg-transparent px-3 py-0 font-bold shadow-none dark:bg-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          'text-xl ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 md:text-xl',
          inputClassName
        )}
        disabled={(isBalanceLoading && Boolean(isBalanceMax)) || props.disabled}
        defaultValue={initialAmount?.toString()}
      />
      {showMaxButton && (
        <Button
          variant="primaryGhost"
          size="icon"
          className="size-fit md:size-fit bg-transparent px-1"
          onClick={() => {
            if (inputRef.current && balance) {
              autoNumericRef.current?.set(balance);
              setAmount(Number(balance));
            }
          }}
          disabled={isBalanceLoading}
        >
          Max
        </Button>
      )}
    </div>
  );
};
