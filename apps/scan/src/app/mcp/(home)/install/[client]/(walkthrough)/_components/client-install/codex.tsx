import { CopyCommand } from '../copy-command';

import type { ClientInstallComponent } from '../install';

export const CodexInstall: ClientInstallComponent = ({ invite }) => {
  return (
    <CopyCommand
      title="Manual Install"
      command={`codex mcp add context7 -- npx -y @x402scan/mcp@latest${invite ? ` --invite ${invite}` : ''}`}
    />
  );
};
