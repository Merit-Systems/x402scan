import { CopyCode } from '@/components/ui/copy-code';

export const ClaudeCodeInstall = () => {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium">Manual Install</p>
      <CopyCode
        code={`claude mcp add x402scan --scope user -- npx -y x402scan-mcp@latest`}
        toastMessage="MCP install command copied to clipboard"
        className="w-full"
        copyButtonClassName="bg-transparent shadow-none border-0"
        textClassName="text-sm"
      />
    </div>
  );
};
