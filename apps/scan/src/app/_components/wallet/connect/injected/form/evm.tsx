import { useConnect } from 'wagmi';

import { ConnectEVMInjectedWalletButtons } from '../buttons/evm';
import { ConnectInjectedWalletButtonsWrapper } from './wrapper';
import { ConnectInjectedWalletEmpty } from './empty';

export const ConnectEVMInjectedWalletForm = () => {
  const { connectors } = useConnect();

  const filteredConnectors = connectors.filter(
    connector =>
      connector.type === 'injected' &&
      !['injected', 'cdp-embedded-wallet'].includes(connector.id)
  );

  return (
    <ConnectInjectedWalletButtonsWrapper>
      {filteredConnectors.length > 0 ? (
        <ConnectEVMInjectedWalletButtons connectors={filteredConnectors} />
      ) : (
        <ConnectInjectedWalletEmpty />
      )}
    </ConnectInjectedWalletButtonsWrapper>
  );
};
