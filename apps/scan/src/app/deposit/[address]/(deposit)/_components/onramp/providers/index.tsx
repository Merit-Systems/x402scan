'use client';

import Image from 'next/image';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

import { Item, LoadingItem } from '../../utils/item';

import { ONRAMP_PROVIDERS } from './data';

import type { OnrampProviders } from '@/services/onramp/types';
import type { RouterOutputs } from '@/trpc/client';

interface Props {
  selectedProvider: OnrampProviders;
  setSelectedQuoteIndex: (index: number) => void;
  quotes: RouterOutputs['onramp']['quotes'] | undefined;
  isLoading: boolean;
  onClose: () => void;
}

export const ProviderSelect: React.FC<Props> = ({
  selectedProvider,
  setSelectedQuoteIndex,
  quotes,
  isLoading,
  onClose,
}) => {
  if (isLoading) {
    return (
      <AccordionItem
        value="providers"
        className="border rounded-lg overflow-hidden shadow-xs"
        id="loading-providers"
      >
        <AccordionTrigger className="px-4 hover:no-underline" disabled={true}>
          <LoadingItem hasValue />
        </AccordionTrigger>
      </AccordionItem>
    );
  }

  if (!quotes || quotes.length === 0) {
    return <p>No quotes found</p>;
  }

  if (!quotes || quotes.length === 0) {
    return <p>No quotes found</p>;
  }

  return (
    <AccordionItem
      value="providers"
      className="border rounded-lg overflow-hidden shadow-xs"
      id="providers"
    >
      <AccordionTrigger className="px-4 hover:no-underline">
        <ProviderItem
          provider={selectedProvider}
          quote={
            quotes.find(quote => quote.provider === selectedProvider)!.quote
          }
        />
      </AccordionTrigger>
      {quotes.length > 1 && (
        <AccordionContent className="p-0 w-full border-t">
          {quotes.map((quote, index) => (
            <Button
              key={quote.provider}
              variant="ghost"
              className="w-full h-fit md:h-fit rounded-none"
              onClick={() => {
                setSelectedQuoteIndex(index);
                onClose();
              }}
            >
              <ProviderItem
                key={quote.provider}
                provider={quote.provider}
                quote={quote.quote}
              />
            </Button>
          ))}
        </AccordionContent>
      )}
    </AccordionItem>
  );
};

interface ProviderItemProps {
  provider: OnrampProviders;
  quote: number;
}

const ProviderItem: React.FC<ProviderItemProps> = ({ provider, quote }) => {
  const providerMetadata = ONRAMP_PROVIDERS[provider];
  return (
    <Item
      label={providerMetadata.title}
      description={providerMetadata.description}
      Icon={() => (
        <Image
          src={providerMetadata.icon}
          alt={providerMetadata.title}
          width={24}
          height={24}
          className="size-6 rounded"
        />
      )}
      value={`${quote.toFixed(2)} USDC`}
    />
  );
};
