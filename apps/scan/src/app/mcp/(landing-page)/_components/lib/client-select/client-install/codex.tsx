import { CopyCode } from '@/components/ui/copy-code';

import type { ClientInstallComponent } from '.';

export const CodexInstall: ClientInstallComponent = ({ invite }) => {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium">Manual Install</p>
      <CopyCode
        code={`codex mcp add context7 -- npx -y @x402scan/mcp@latest${invite ? ` --invite ${invite}` : ''}`}
        toastMessage="Codex MCP install command copied to clipboard"
        className="w-full"
        copyButtonClassName="bg-transparent shadow-none border-0"
        textClassName="text-xs"
      />
    </div>
  );
};
