import { useConnect } from "wagmi";

import { ConnectEVMInjectedWalletButtons } from "@/app/(app)/composer/_components/wallet/connect/injected/buttons/evm";

export const EVMNotConnected = () => {
  const { connectors } = useConnect();

  const filteredConnectors = connectors.filter(
    (connector) =>
      connector.type === "injected" &&
      !["injected", "cdp-embedded-wallet"].includes(connector.id)
  );

  if (filteredConnectors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md bg-muted p-2 type-caption">
        <p>No EVM wallets found</p>
      </div>
    );
  }

  return <ConnectEVMInjectedWalletButtons connectors={filteredConnectors} />;
};
