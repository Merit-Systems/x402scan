'use client';

import dynamic from 'next/dynamic';
import { cdpConfig } from './config';

const CDPHooksProviderBase = dynamic(
  () => import('@coinbase/cdp-hooks').then(mod => mod.CDPHooksProvider),
  {
    ssr: false,
  }
);

interface Props {
  children: React.ReactNode;
}

export const CDPHooksProvider = ({ children }: Props) => {
  return (
    <CDPHooksProviderBase config={cdpConfig}>{children}</CDPHooksProviderBase>
  );
};
