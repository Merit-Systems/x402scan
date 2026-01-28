'use client';

import { useEffect, useState } from 'react';

import { useConnectors } from 'wagmi';

import { useQueries } from '@tanstack/react-query';

import { Accordion } from '@/components/ui/accordion';

import { MethodSelect } from './methods';
import { Onramp } from './onramp';
import { Transfer } from './transfer';
import { InviteCodeRedemption } from './invite';

import { OnrampMethods } from '@/services/onramp/types';

import { WalletChainProvider } from '@/app/(app)/_contexts/wallet-chain/provider';

import { Chain } from '@/types/chain';

import type { Connector } from 'wagmi';
import type { Address } from 'viem';
import type { DepositSearchParams } from '../../_lib/params';

interface Props {
  address: Address;
  searchParams?: DepositSearchParams;
}

export const Deposit: React.FC<Props> = ({ address }) => {
  const [connectorsReady, setConnectorsReady] = useState(false);

  const connectors = useConnectors();

  const filteredConnectors = connectors.filter(
    connector => connector.type === 'injected' && connector.id !== 'injected'
  );

  useEffect(() => {
    setTimeout(() => {
      setConnectorsReady(true);
    }, 0);
  }, [connectors, connectorsReady]);

  const authedConnectors = useQueries({
    queries: filteredConnectors.map(connector => ({
      queryKey: ['is-connected', connector.id],
      queryFn: () => connector.isAuthorized(),
    })),
  });

  if (!connectorsReady || authedConnectors.some(query => query.isLoading)) {
    return null;
  }

  const connectorsWithIsAuthorized = authedConnectors.map(
    ({ data }, index) => ({
      connector: filteredConnectors[index],
      isAuthorized: data,
    })
  );

  return (
    <DepositWithConnectorsContent
      connectors={connectorsWithIsAuthorized
        .filter(
          ({ connector, isAuthorized }) =>
            connector?.type === 'injected' &&
            !(connector.id === 'cdp-embedded-wallet' && !isAuthorized)
        )
        .sort(({ isAuthorized: a }) => {
          return a ? -1 : 1;
        })
        .map(({ connector }) => connector)
        .filter(connector => connector !== undefined)}
      address={address}
    />
  );
};

interface DepositContentProps {
  connectors: Connector[];
  address: Address;
  searchParams?: DepositSearchParams;
}

const DepositWithConnectorsContent: React.FC<DepositContentProps> = ({
  connectors,
  address,
  searchParams,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<OnrampMethods>(
    connectors.length > 0 ? OnrampMethods.WALLET : OnrampMethods.DEBIT_CARD
  );
  const [accordionValue, setAccordionValue] = useState<string[]>([]);

  return (
    <WalletChainProvider initialChain={Chain.BASE} isFixed>
      <Accordion
        type="multiple"
        value={accordionValue}
        onValueChange={setAccordionValue}
        className="w-full flex flex-col gap-4"
      >
        <MethodSelect
          selectedMethod={selectedMethod}
          onMethodChange={setSelectedMethod}
          onClose={() =>
            setAccordionValue(
              accordionValue.filter(value => value !== 'methods')
            )
          }
          hasInjectedWallets={connectors.length > 0}
        />
        {selectedMethod === OnrampMethods.WALLET ? (
          <Transfer
            connectors={connectors}
            address={address}
            setAccordionValue={setAccordionValue}
            searchParams={searchParams}
          />
        ) : selectedMethod === OnrampMethods.INVITE_CODE ? (
          <InviteCodeRedemption address={address} />
        ) : (
          <Onramp
            selectedMethod={selectedMethod}
            setAccordionValue={setAccordionValue}
            address={address}
          />
        )}
      </Accordion>
    </WalletChainProvider>
  );
};
