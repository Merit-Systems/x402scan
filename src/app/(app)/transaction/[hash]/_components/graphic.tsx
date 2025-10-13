'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { AnimatedBeam } from '@/components/magicui/animated-beam';

import { facilitatorAddressMap } from '@/lib/facilitators';

import { Seller } from '@/app/(app)/_components/seller';
import { Address } from '@/components/ui/address';
import { formatTokenAmount } from '@/lib/token';
import { useIsMobile } from '@/hooks/use-is-mobile';

import type { Address as AddressType } from 'viem';
import type { FacilitatorAddress } from '@/lib/facilitators';

interface Props {
  buyerAddress: AddressType;
  facilitatorAddress: FacilitatorAddress;
  sellerAddress: AddressType;
  amount: bigint;
}

export const TransactionGraphic: React.FC<Props> = ({
  buyerAddress,
  facilitatorAddress,
  sellerAddress,
  amount,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const buyerRef = useRef<HTMLDivElement>(null);
  const facilitatorRef = useRef<HTMLDivElement>(null);
  const sellerRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();

  const beamDuration = 3;

  const [isReverse, setIsReverse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsReverse(prev => !prev);
    }, beamDuration * 1000);
    return () => clearInterval(interval);
  }, []);

  const beamProps = {
    duration: beamDuration,
    reverse: isReverse,
  };

  const facilitator = facilitatorAddressMap.get(facilitatorAddress);

  const cardClassName = 'z-10 overflow-hidden w-full md:w-auto md:flex-1';

  return (
    <div
      ref={containerRef}
      className="relative size-full flex flex-col md:flex-row items-center justify-between w-full gap-12 md:gap-24"
    >
      <Card className={cardClassName} ref={buyerRef}>
        <CardHeader className="p-2 bg-muted border-b">
          <CardTitle className="text-base">Buyer</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Address address={buyerAddress} className="text-base font-semibold" />
        </CardContent>
      </Card>

      <Link
        href={`/recipient/${sellerAddress}`}
        className={cardClassName}
        prefetch={false}
      >
        <Card className="w-full overflow-hidden" ref={sellerRef}>
          <CardHeader className="p-2 bg-muted border-b flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Seller</CardTitle>
            <p className="text-base font-bold text-primary">
              {formatTokenAmount(amount)}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <Seller
              address={sellerAddress}
              addressClassName="text-base font-semibold"
            />
          </CardContent>
        </Card>
      </Link>
      <Card className={cardClassName} ref={facilitatorRef}>
        <CardHeader className="p-2 bg-muted border-b">
          {facilitator && (
            <div className="flex items-center gap-2">
              <Image
                src={facilitator.image}
                alt={facilitator.name}
                width={32}
                height={32}
              />
              <p className="text-base font-semibold">{facilitator.name}</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          <Address
            address={facilitatorAddress}
            className="text-base font-semibold"
          />
        </CardContent>
      </Card>
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={buyerRef}
        toRef={sellerRef}
        isVertical={isMobile}
        {...beamProps}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={sellerRef}
        toRef={facilitatorRef}
        isVertical={isMobile}
        {...beamProps}
      />
    </div>
  );
};
