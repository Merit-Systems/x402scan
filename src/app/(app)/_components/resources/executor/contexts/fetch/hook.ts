import { useContext } from 'react';

import { ResourceFetchContext } from './context';

export const useResourceFetch = () => {
  const context = useContext(ResourceFetchContext);
  if (!context) {
    throw new Error(
      'useResourceFetch must be used within a ResourceFetchProvider'
    );
  }
  return context;
};
