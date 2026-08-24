'use client';

import { CDPHooksProvider as CDPHooksProviderBase } from '@coinbase/cdp-hooks';

import { cdpConfig } from './config';

interface Props {
  children: React.ReactNode;
}

/**
 * Rendered on the server as well as the client. `CDPHooksProvider` only
 * touches browser APIs inside `useEffect` (SDK initialisation), so it is safe
 * to server-render. It was previously loaded with `next/dynamic` + `ssr: false`,
 * which disabled server rendering for the *entire* app tree below it
 * (`BAILOUT_TO_CLIENT_SIDE_RENDERING`), leaving crawlers and agents with an
 * empty `<body>`.
 */
export const CDPHooksProvider = ({ children }: Props) => {
  return (
    <CDPHooksProviderBase config={cdpConfig}>{children}</CDPHooksProviderBase>
  );
};
