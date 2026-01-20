'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { ClientsSelect } from './select';
import { SelectedClient } from './selected';

import type { Clients } from '../../../clients/data';

export const ClientSelect = () => {
  const [selectedClient, setSelectedClient] = useState<Clients | null>(null);

  return (
    <Popover>
      <PopoverTrigger>
        <Button
          size="lg"
          className="px-6 h-12 text-white rounded-xl font-semibold"
        >
          Get Started
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={12}
        className="p-0"
      >
        {selectedClient ? (
          <SelectedClient
            client={selectedClient}
            reset={() => setSelectedClient(null)}
          />
        ) : (
          <ClientsSelect onClientSelect={setSelectedClient} />
        )}
      </PopoverContent>
    </Popover>
  );
};
