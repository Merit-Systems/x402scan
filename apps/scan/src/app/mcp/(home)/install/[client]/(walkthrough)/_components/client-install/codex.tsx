import { CopyCommand } from '../copy-command';

import type { ClientInstallComponent } from '../install';

export const CodexInstall: ClientInstallComponent = ({ invite }) => {
  return (
    <CopyCommand
      title="Manual Install"
      command={`codex mcp add context7 -- npx -y agentcash@latest${invite ? ` --invite ${invite}` : ''}`}
    />
  );
};
