import { useConnect } from 'wagmi';

import { ConnectEVMInjectedWalletButtons } from '../../connect/injected/buttons/evm';

export const EVMNotConnected = () => {
  const { connectors } = useConnect();

  const filteredConnectors = connectors.filter(
    connector =>
      connector.type === 'injected' &&
      !['injected', 'cdp-embedded-wallet'].includes(connector.id)
  );

  if (filteredConnectors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 text-xs p-2 bg-muted rounded-md">
        <p>No EVM wallets found</p>
      </div>
    );
  }

  return <ConnectEVMInjectedWalletButtons connectors={filteredConnectors} />;
};
