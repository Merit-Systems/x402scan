'use client';

import { useState } from 'react';

import { EmbeddedWalletOTP } from './otp';
import { EmbeddedWalletEmail } from './email';

export const ConnectEmbeddedWalletForm = () => {
  const [flowId, setFlowId] = useState('');

  if (flowId) {
    return (
      <div className="space-y-4">
        <EmbeddedWalletOTP flowId={flowId} handleReset={() => setFlowId('')} />
      </div>
    );
  }

  return <EmbeddedWalletEmail setFlowId={setFlowId} />;
};
