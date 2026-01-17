import { CopyCode } from '@/components/ui/copy-code';
import { Body } from '../_components/layout/page-utils';
import { ClientSelect } from './_components/client-select';
import { HeroGraphic } from './_components/graphic/graphic';
import { Badge } from '@/components/ui/badge';

export default function McpPage() {
  return (
    <Body className="max-w-lg mx-auto gap-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 items-center justify-center text-center">
          <Badge className="bg-primary/10 text-primary border-primary/60 hover:bg-primary/20">
            Now Available
          </Badge>
          <h1 className="text-5xl font-bold font-mono">x402scan MCP</h1>
          <p className="text-base">
            Make paid API requests to any x402 endpoint from Claude Code,
            Cursor, and more.
          </p>
        </div>
        <div className="flex justify-center mb-4">
          <CopyCode
            code={'npx @x402scan/mcp install'}
            toastMessage="MCP Server URL copied to clipboard"
            className="bg-card w-fit pl-3 font-bold text-primary"
            copyButtonClassName="bg-transparent shadow-none border-0"
            textClassName="text-base"
          />
        </div>
        <HeroGraphic />
      </div>
      <ClientSelect />
    </Body>
  );
}
