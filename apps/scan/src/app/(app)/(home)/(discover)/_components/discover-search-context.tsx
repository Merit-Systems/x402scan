'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface DiscoverSearchContextValue {
  input: string;
  setInput: (value: string) => void;
  query: string;
  isSearching: boolean;
  isDirty: boolean;
  submit: () => void;
  clear: () => void;
}

const DiscoverSearchContext = createContext<DiscoverSearchContextValue | null>(
  null
);

export const useDiscoverSearch = () => {
  const ctx = useContext(DiscoverSearchContext);
  if (!ctx)
    throw new Error(
      'useDiscoverSearch must be used within DiscoverSearchProvider'
    );
  return ctx;
};

export const DiscoverSearchProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [input, setInputRaw] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);

  const setInput = useCallback(
    (value: string) => {
      setInputRaw(value);
      if (value.trim().length === 0 && query.length > 0) {
        setQuery('');
        router.replace('/', { scroll: false });
      }
    },
    [query, router]
  );

  const submit = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed.length > 0) {
      setQuery(trimmed);
      router.replace(`/?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    }
  }, [input, router]);

  const clear = useCallback(() => {
    setInputRaw('');
    setQuery('');
    router.replace('/', { scroll: false });
  }, [router]);

  const isSearching = query.length > 0;
  const isDirty = input.trim() !== query;

  return (
    <DiscoverSearchContext.Provider
      value={{ input, setInput, query, isSearching, isDirty, submit, clear }}
    >
      {children}
    </DiscoverSearchContext.Provider>
  );
};
