'use client';

import { Card } from '@/components/ui/card';
import { useState } from 'react';

import { SelectedClient } from './selected';
import { ClientsSelect } from './select';

import type { Clients } from '../clients/data';

export const ClientSelect = () => {
  const [selectedClient, setSelectedClient] = useState<Clients | null>(
    null
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center justify-center text-center text-2xl font-bold">
        <h2 className="">Use x402 in</h2>
        <h2 className="text-primary">
          Every Agentic Client
        </h2>
      </div>
    <Card className="h-full">
      {selectedClient ? (
        <SelectedClient client={selectedClient} reset={() => setSelectedClient(null)} />
      ) : (
        <ClientsSelect onClientSelect={setSelectedClient} />
      )}
    </Card>
    </div>
  );
};
