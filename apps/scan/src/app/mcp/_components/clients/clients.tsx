'use client';

import { Card } from '@/components/ui/card';
import { useState } from 'react';

import { SelectedClient } from './selected';
import { ClientsSelect } from './select';

import type { Clients as ClientsEnum } from './data';

export const Clients = () => {
  const [selectedClient, setSelectedClient] = useState<ClientsEnum | null>(
    null
  );

  return (
    <Card className="h-full">
      {selectedClient ? (
        <SelectedClient client={selectedClient} />
      ) : (
        <ClientsSelect onClientSelect={setSelectedClient} />
      )}
    </Card>
  );
};
