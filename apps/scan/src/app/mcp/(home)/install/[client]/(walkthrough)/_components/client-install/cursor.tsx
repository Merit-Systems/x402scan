import { Button } from '@/components/ui/button';

import type { ClientInstallComponent } from '../install';
import { ClientIcon } from '@/app/mcp/_components/client-icon';
import { Clients } from '@/app/mcp/_lib/clients';
import { isBrowser } from '@/lib/runtime-env';

/** The MCP server launch config embedded in the Cursor deep link. */
interface McpServerConfig {
  command: string;
  args: string[];
}

const encodeConfig = (config: McpServerConfig) => {
  const payload = JSON.stringify(config);

  if (isBrowser) {
    return window.btoa(payload);
  }

  return Buffer.from(payload, 'utf-8').toString('base64');
};

const cursorDeepLink = (invite?: string) => {
  const args = ['-y', '@x402scan/mcp@latest'];

  if (invite) {
    args.push(`--invite ${invite}`);
  }

  const config: McpServerConfig = {
    command: 'npx',
    args,
  };

  const encodedConfig = encodeConfig(config);

  return `cursor://anysphere.cursor-deeplink/mcp/install?name=x402&config=${encodeURIComponent(encodedConfig)}`;
};

export const CursorInstall: ClientInstallComponent = ({ invite }) => {
  return (
    <a href={cursorDeepLink(invite)}>
      <Button
        className="w-full h-fit py-4 border-2 shadow-none bg-muted"
        size="xl"
        variant="outline"
      >
        <ClientIcon client={Clients.Cursor} className="size-4" />
        One-Click Install
      </Button>
    </a>
  );
};
