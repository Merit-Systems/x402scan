"use client";

import { cdpConfig } from "./config";

import dynamic from "next/dynamic";

const CDPHooksProviderBase = dynamic(
  () => import("@coinbase/cdp-hooks").then((mod) => mod.CDPHooksProvider),
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
