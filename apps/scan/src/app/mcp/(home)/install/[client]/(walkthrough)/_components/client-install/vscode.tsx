import { CopyCommand } from '../copy-command';

import type { ClientInstallComponent } from '../install';

export const VscodeInstall: ClientInstallComponent = ({ invite }) => {
  return (
    <CopyCommand
      title="Manual Install"
      command={`code --add-mcp "{\\"name\\":\\"agentcash\\",\\"command\\": \\"npx\\",\\"args\\": [\\"-y\\",\\"agentcash@latest\\"${invite ? `, \\"--invite\\", \\"${invite}\\"` : ''}]}"`}
    />
  );
};
