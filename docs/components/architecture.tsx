import { SequenceDiagram } from './sequence-diagram';

export const Architecture = () => {
  return (
    <SequenceDiagram
      actors={['Client', 'Server', 'Facilitator']}
      messages={[
        {
          sender: 'Client',
          receiver: 'Server',
          message: 'Fetch /protected/resource',
        },
        {
          sender: 'Server',
          receiver: 'Client',
          message: '402: Payment Required',
        },
        { sender: 'Client', receiver: 'Server', message: 'X-PAYMENT_HEADER' },
        {
          sender: 'Server',
          receiver: 'Facilitator',
          message: 'Verify Payment',
        },
        {
          sender: 'Facilitator',
          receiver: 'Server',
          message: 'Signature Valid',
        },
        {
          sender: 'Server',
          receiver: 'Facilitator',
          message: 'Settle Payment',
        },
        {
          sender: 'Facilitator',
          receiver: 'Server',
          message: 'Payment Settled',
        },
        {
          sender: 'Server',
          receiver: 'Client',
          message: 'Protected Resource',
        },
      ]}
    />
  );
};
