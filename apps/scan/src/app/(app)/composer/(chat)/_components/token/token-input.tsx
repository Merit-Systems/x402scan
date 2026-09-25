"use client";

import React, { useEffect, useRef } from "react";

import AutoNumeric from "autonumeric";

import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { TokenSelect } from "./token-select";

import { useEvmTokenBalance } from "@/app/(app)/composer/_hooks/balance/token/use-evm-token-balance";
import { useSPLTokenBalance } from "@/app/(app)/composer/_hooks/balance/token/use-svm-token-balance";

import { cn } from "@/lib/utils";
import { ethereumAddressSchema, solanaAddressSchema } from "@/lib/schemas";

import { Chain } from "@/types/chain";

import type { Token } from "@/types/token";
import type { MixedAddress } from "@/types/address";

type Props = {
  onChange: (value: number) => void;
  label: string;
  selectedToken: Token;
  onTokenChange?: (token: Token) => void;
  chain?: Chain;
  tokens?: Token[];
  className?: string;
  inputClassName?: string;
  isBalanceMax?: boolean;
  address?: MixedAddress;
  balanceProp?: {
    balance: number | undefined;
    isLoading: boolean;
  };
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "size">;

const NO_TOKENS: Token[] = [];

export const TokenInput: React.FC<Props> = ({
  onChange,
  selectedToken,
  onTokenChange,
  tokens = NO_TOKENS,
  isBalanceMax = false,
  chain,
  label,
  className,
  inputClassName,
  address,
  balanceProp,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autoNumericRef = useRef<AutoNumeric | null>(null);
  const evmAddress = ethereumAddressSchema.safeParse(address);
  const solanaAddress = solanaAddressSchema.safeParse(address);

  const { data: evmBalance, isLoading: isEvmBalanceLoading } =
    useEvmTokenBalance({
      token: selectedToken,
      address: evmAddress.success ? evmAddress.data : undefined,
      query: {
        enabled:
          isBalanceMax && chain !== Chain.SOLANA && balanceProp === undefined,
        refetchOnMount: "always",
      },
    });

  const { data: svmBalance, isLoading: isSolanaBalanceLoading } =
    useSPLTokenBalance({
      enabled:
        isBalanceMax && chain === Chain.SOLANA && balanceProp === undefined,
      address: solanaAddress.success ? solanaAddress.data : undefined,
    });

  const { balance, isLoading } =
    balanceProp ??
    (chain === Chain.SOLANA
      ? {
          balance: svmBalance,
          isLoading: isSolanaBalanceLoading,
        }
      : {
          balance: evmBalance,
          isLoading: isEvmBalanceLoading,
        });

  useEffect(() => {
    if (inputRef.current) {
      const maximumValue =
        balance && balance > 0 ? balance.toString() : "99999999999999.99";

      autoNumericRef.current = new AutoNumeric(inputRef.current, {
        digitGroupSeparator: "",
        decimalCharacter: ".",
        decimalPlaces: selectedToken.decimals,
        currencySymbol: "",
        minimumValue: "0",
        maximumValue,
        modifyValueOnWheel: false,
        formatOnPageLoad: true,
        unformatOnSubmit: true,
        watchExternalChanges: true,
        emptyInputBehavior: "zero",
        overrideMinMaxLimits: "invalid",
        allowDecimalPadding: false,
      });

      // Add event listener for value changes
      inputRef.current.addEventListener("autoNumeric:formatted", () => {
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
      const amount = (balance * percentage) / 100;
      autoNumericRef.current?.set(amount);
      onChange(amount);
    }
  };

  return (
    <div
      className={cn(
        "border-border bg-card/50 flex flex-col gap-3 rounded-xl border-2 p-3 transition-all duration-200",
        "focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-[3px]",
        className
      )}
    >
      <span className="type-supporting-body type-emphasis text-muted-foreground">
        {label}
      </span>

      <div className="flex items-center gap-3">
        {/* Amount input */}
        <Input
          {...props}
          ref={inputRef}
          type="text"
          placeholder="0"
          className={cn(" w-full ", " ", inputClassName)}
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
            {[25, 50, 75].map((percent) => (
              <Button
                key={percent}
                variant="ghost"
                size="xs"
                className="size-fit"
                onClick={() => {
                  handlePercentageClick(percent);
                }}
                disabled={!balance || props.disabled}
              >
                {percent}%
              </Button>
            ))}
            <Button
              variant="ghost"
              size="xs"
              className="size-fit"
              onClick={() => {
                handlePercentageClick(100);
              }}
              disabled={!balance || props.disabled}
            >
              Max
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="size-3 text-muted-foreground" />
            {isLoading ? (
              <Skeleton className="h-4 w-16" />
            ) : balance === undefined ? null : (
              <div className="flex items-center justify-end type-caption text-muted-foreground">
                <span>
                  {balance} {selectedToken.symbol}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
