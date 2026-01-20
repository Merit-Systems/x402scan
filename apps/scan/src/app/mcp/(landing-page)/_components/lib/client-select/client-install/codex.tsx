import { CopyCode } from '@/components/ui/copy-code';

export const CodexInstall = () => {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium">Manual Install</p>
      <CopyCode
        code={`codex mcp add context7 -- npx -y @x402scan/mcp@latest`}
        toastMessage="Codex MCP install command copied to clipboard"
        className="w-full"
        copyButtonClassName="bg-transparent shadow-none border-0"
        textClassName="text-xs"
      />
    </div>
  );
};
