import { useConnect } from 'wagmi';

import { ConnectEVMInjectedWalletButtons } from '../buttons/evm';
import { ConnectInjectedWalletButtonsWrapper } from './wrapper';

export const ConnectEVMInjectedWalletForm = () => {
  const { connectors } = useConnect();

  const filteredConnectors = connectors.filter(
    connector =>
      connector.type === 'injected' &&
      !['injected', 'cdp-embedded-wallet'].includes(connector.id)
  );

  if (filteredConnectors.length === 0) {
    return null;
  }

  return (
    <ConnectInjectedWalletButtonsWrapper>
      <ConnectEVMInjectedWalletButtons connectors={filteredConnectors} />
    </ConnectInjectedWalletButtonsWrapper>
  );
};
