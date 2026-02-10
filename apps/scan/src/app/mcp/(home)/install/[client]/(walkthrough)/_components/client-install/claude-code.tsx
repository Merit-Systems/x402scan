import { CopyCommand } from '../copy-command';

import type { ClientInstallComponent } from '../install';

export const ClaudeCodeInstall: ClientInstallComponent = ({ invite }) => {
  return (
    <CopyCommand
      title="Manual Install"
      command={`claude mcp add x402scan --scope user -- npx -y @x402scan/mcp@latest${invite ? ` -- invite ${invite}` : ''}`}
    />
  );
};
