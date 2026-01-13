import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useConnections, useReadContract } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

import { TokenInput } from '@/components/ui/token/token-input';

import { ConnectButton } from './connect-button';
import { TransferButton } from './transfer-button';

import { Item } from '../utils/item';

import { usdc } from '@/lib/tokens/usdc';

import type { SetStateAction, Dispatch } from 'react';
import type { Address } from 'viem';
import type { Connector } from 'wagmi';
import { Chain, CHAIN_ID } from '@/types/chain';

interface Props {
  connectors: Connector[];
  address: Address;
  setAccordionValue: Dispatch<SetStateAction<string[]>>;
}

export const Transfer: React.FC<Props> = ({
  connectors,
  setAccordionValue,
  address,
}) => {
  const [amount, setAmount] = useState<number>(5);
  const [selectedConnector, setSelectedConnector] = useState<Connector>(
    connectors[0]!
  );

  const connections = useConnections();
  const connection = connections.find(
    connection => connection.connector.id === selectedConnector.id
  );

  const connectionAddress = connection?.accounts[0];

  const usdcToken = usdc(Chain.BASE);

  const { data: balanceUnits, isLoading: isLoadingBalance } = useReadContract({
    address: usdcToken.address as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [connectionAddress!],
    chainId: CHAIN_ID[usdcToken.chain],
    query: {
      enabled: Boolean(connectionAddress),
    },
  });

  const balance =
    balanceUnits !== undefined
      ? Number(formatUnits(balanceUnits, usdcToken.decimals))
      : undefined;

  return (
    <>
      <TokenInput
        label="Amount"
        selectedToken={usdcToken}
        onChange={setAmount}
        defaultValue={amount}
        balanceProp={
          connectionAddress !== undefined
            ? {
                balance: balance ?? 0,
                isLoading: isLoadingBalance,
              }
            : undefined
        }
        isBalanceMax={connectionAddress !== undefined}
      />
      <AccordionItem
        value="wallets"
        className="border rounded-lg overflow-hidden shadow-xs"
      >
        <AccordionTrigger className="px-4 hover:no-underline">
          <WalletItem connector={selectedConnector} />
        </AccordionTrigger>
        <AccordionContent className="p-0 w-full border-t">
          {connectors.map(connector => (
            <Button
              key={connector.id}
              variant="ghost"
              className="w-full h-fit md:h-fit rounded-none"
              onClick={() => {
                setSelectedConnector(connector);
                setAccordionValue(accordionValue =>
                  accordionValue.filter(value => value !== 'wallets')
                );
              }}
            >
              <WalletItem key={connector.id} connector={connector} />
            </Button>
          ))}
        </AccordionContent>
      </AccordionItem>
      {connections !== undefined &&
        (connection ? (
          <TransferButton
            connector={selectedConnector}
            address={address}
            amount={amount}
            balance={{
              isLoading: isLoadingBalance,
              value: balance,
            }}
          />
        ) : (
          <ConnectButton connector={selectedConnector} />
        ))}
    </>
  );
};

interface WalletItemProps {
  connector: Connector;
}

const WalletItem: React.FC<WalletItemProps> = ({ connector }) => {
  const { data: isConnected } = useQuery({
    queryKey: ['is-connected', connector.id],
    queryFn: async () => await connector.isAuthorized(),
  });

  return (
    <Item
      label={connector.name}
      Icon={({ className }) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={connector.icon} alt={connector.name} className={className} />
      )}
      description={isConnected ? 'Connected' : 'Not Connected'}
    />
  );
};
