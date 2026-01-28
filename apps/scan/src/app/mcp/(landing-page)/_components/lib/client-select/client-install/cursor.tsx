import { Button } from '@/components/ui/button';

import type { ClientInstallComponent } from '.';

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
      <Button variant="outline" className="w-full" size="lg">
        One-Click Install
      </Button>
    </a>
  );
};
