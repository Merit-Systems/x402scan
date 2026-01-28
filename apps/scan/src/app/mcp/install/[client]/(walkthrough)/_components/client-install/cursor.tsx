import { Button } from '@/components/ui/button';

import type { ClientInstallComponent } from '../install';
import { ClientIcon } from '@/app/mcp/_components/client-icon';
import { Clients } from '@/app/mcp/_lib/clients';

const encodeConfig = (config: Record<string, unknown>) => {
  const payload = JSON.stringify(config);

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(payload);
  }

  return Buffer.from(payload, 'utf-8').toString('base64');
};

const cursorDeepLink = (invite?: string) => {
  const command = invite
    ? `source $HOME/.nvm/nvm.sh 2>/dev/null; exec npx -y @x402scan/mcp@latest --invite ${invite}`
    : 'source $HOME/.nvm/nvm.sh 2>/dev/null; exec npx -y @x402scan/mcp@latest';

  const config = {
    command: '/bin/bash',
    args: ['-c', command],
  };

  const encodedConfig = encodeConfig(config);

  return `cursor://anysphere.cursor-deeplink/mcp/install?name=x402&config=${encodeURIComponent(encodedConfig)}`;
};

export const CursorInstall: ClientInstallComponent = ({ invite }) => {
  return (
    <a href={cursorDeepLink(invite)}>
      <Button
        className="w-full h-fit py-4 border-2 shadow-none"
        size="xl"
        variant="outline"
      >
        <ClientIcon client={Clients.Cursor} className="size-4" />
        One-Click Install
      </Button>
    </a>
  );
};
