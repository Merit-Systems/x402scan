import { CopyCode } from '@/components/ui/copy-code';

export const VscodeInstall = () => {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium">Manual Install</p>
      <CopyCode
        code={`code --add-mcp "{\\"name\\":\\"x402\\",\\"command\\": \\"npx\\",\\"args\\": [\\"-y\\",\\"@x402scan/mcp@latest\\"]}"`}
        toastMessage="VSCode MCP install command copied to clipboard"
        className="w-full"
        copyButtonClassName="bg-transparent shadow-none border-0"
        textClassName="text-sm"
      />
    </div>
  );
};
