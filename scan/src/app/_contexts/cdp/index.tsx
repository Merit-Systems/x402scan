'use client';

import { cdpConfig } from './config';

import { CDPHooksProvider as CDPHooksProviderBase } from '@coinbase/cdp-hooks';

interface Props {
  children: React.ReactNode;
}

export const CDPHooksProvider = ({ children }: Props) => {
  return (
    <CDPHooksProviderBase config={cdpConfig}>{children}</CDPHooksProviderBase>
  );
};
