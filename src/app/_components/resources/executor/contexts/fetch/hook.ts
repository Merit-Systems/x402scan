import { useContext } from 'react';

import { ResourceFetchContext } from './context';

export const useResourceFetch = () => {
  const context = useContext(ResourceFetchContext);
  return context;
};
