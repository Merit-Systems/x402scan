import { Button } from '@/components/ui/button';

import type { ClientInstallComponent } from '.';

const cursorDeepLink = (invite?: string) => {
  const config = {
    command: 'npx',
    args: ['-y', '@x402scan/mcp@latest'],
  };

  if (invite) {
    config.args.push('--invite', invite);
  }

  return `cursor://anysphere.cursor-deeplink/mcp/install?name=x402&config=${encodeURIComponent(JSON.stringify(config))}`;
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
