import { CopyCommand } from '../copy-command';

import type { ClientInstallComponent } from '../install';

export const VscodeInstall: ClientInstallComponent = ({ invite }) => {
  return (
    <CopyCommand
      title="Manual Install"
      command={`code --add-mcp "{\\"name\\":\\"x402\\",\\"command\\": \\"npx\\",\\"args\\": [\\"-y\\",\\"@x402scan/mcp@latest\\"${invite ? `, \\"--invite\\", \\"${invite}\\"` : ''}]}"`}
    />
  );
};
