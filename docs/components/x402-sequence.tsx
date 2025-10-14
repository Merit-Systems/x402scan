'use client';

import { Server, ShieldCheck, User } from 'lucide-react';
import { SequenceDiagram } from '../../src/components/xyflow/sequence-diagram';

export const Architecture = () => {
  return (
    <SequenceDiagram
      actors={[
        { name: 'Client', Icon: User },
        { name: 'Server', Icon: Server },
        { name: 'Facilitator', Icon: ShieldCheck },
      ]}
      messages={[
        {
          sender: 'Client',
          receiver: 'Server',
          message: 'Fetch /protected/resource',
        },
        {
          sender: 'Server',
          receiver: 'Client',
          message: '402 + Payment Instructions',
        },
        {
          sender: 'Client',
          receiver: 'Server',
          message: 'Fetch + X-PAYMENT_HEADER',
        },
        {
          sender: 'Server',
          receiver: 'Facilitator',
          message: 'POST /verify',
        },
        {
          sender: 'Facilitator',
          receiver: 'Server',
          message: '200: Signature Valid',
        },
        {
          sender: 'Server',
          receiver: 'Facilitator',
          message: 'POST /settle',
        },
        {
          sender: 'Facilitator',
          receiver: 'Server',
          message: '200: Payment Settled',
        },
        {
          sender: 'Server',
          receiver: 'Client',
          message: '200: Protected Resource',
        },
      ]}
    />
  );
};
