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
      <div>
        <p>No EVM wallets found</p>
      </div>
    );
  }

  return <ConnectEVMInjectedWalletButtons connectors={filteredConnectors} />;
};
