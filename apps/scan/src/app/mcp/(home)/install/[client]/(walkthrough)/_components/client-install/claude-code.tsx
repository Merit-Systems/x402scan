import { CopyCommand } from '../copy-command';

import type { ClientInstallComponent } from '../install';

export const ClaudeCodeInstall: ClientInstallComponent = ({ invite }) => {
  return (
    <CopyCommand
      title="Manual Install"
      command={`claude mcp add agentcash --scope user -- npx -y agentcash@latest${invite ? ` -- invite ${invite}` : ''}`}
    />
  );
};
