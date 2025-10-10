export const REGISTRY_ABI = [
    {
      type: 'function',
      name: 'add',
      inputs: [
        {
          name: 'resource',
          type: 'tuple',
          components: [
            { name: 'scheme', type: 'string' },
            { name: 'network', type: 'string' },
            { name: 'maxAmountRequired', type: 'uint256' },
            { name: 'resource', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'mimeType', type: 'string' },
            { name: 'outputSchema', type: 'string' },
            { name: 'payTo', type: 'address' },
            { name: 'maxTimeoutSeconds', type: 'uint32' },
            { name: 'asset', type: 'address' },
            { name: 'extra', type: 'string' },
          ],
        },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
  ] as const;