'use client';

import { Button } from '@/components/ui/button';

import { METHOD_METADATA } from './data';

import { OnrampMethods } from '@/services/onramp/types';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Item } from '../utils/item';

interface Props {
  onClose: () => void;
  selectedMethod: OnrampMethods;
  onMethodChange: (method: OnrampMethods) => void;
  hasInjectedWallets: boolean;
}

export const MethodSelect: React.FC<Props> = ({
  selectedMethod,
  onMethodChange,
  onClose,
  hasInjectedWallets,
}) => {
  const handleMethodChange = (method: OnrampMethods) => {
    onMethodChange(method);
    onClose();
  };

  const methods = hasInjectedWallets
    ? Object.values(OnrampMethods)
    : Object.values(OnrampMethods).filter(
        method => method !== OnrampMethods.WALLET
      );

  return (
    <AccordionItem
      value="methods"
      className="border rounded-lg overflow-hidden shadow-xs"
    >
      <AccordionTrigger className="px-4 hover:no-underline">
        <MethodItem method={selectedMethod} />
      </AccordionTrigger>
      <AccordionContent className="p-0 w-full border-t">
        {methods.map(method => (
          <Button
            key={method}
            variant="ghost"
            className="w-full h-fit md:h-fit rounded-none"
            onClick={() => handleMethodChange(method)}
          >
            <MethodItem key={method} method={method} />
          </Button>
        ))}
      </AccordionContent>
    </AccordionItem>
  );
};

interface MethodItemProps {
  method: OnrampMethods;
}

const MethodItem: React.FC<MethodItemProps> = ({ method }) => {
  const methodMetadata = METHOD_METADATA[method];
  return (
    <Item
      label={methodMetadata.label}
      description={methodMetadata.description}
      Icon={methodMetadata.icon}
    />
  );
};
