import { useWriteContract } from 'wagmi';
import { REGISTRY_ABI } from '../app/on-chain/registry-abi';
import { useCallback } from 'react';
import type { Resource } from '../app/on-chain/types';
import { REGISTRY_ADDRESS } from '../app/on-chain/constants';

export const useAddResource = () => {
  const { writeContractAsync } = useWriteContract();

  const addResource = useCallback(
    async (resource: Resource) => {
      console.log('Adding resource', resource);
      await writeContractAsync({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'add',
        args: [resource],
      });
    },
    [writeContractAsync]
  );

  return { addResource };
};
