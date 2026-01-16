import { CopyCode } from '@/components/ui/copy-code';
import { Body } from '../_components/layout/page-utils';
import { TextSeparator } from '@/components/ui/text-separator';
import { Clients } from './_components/clients/clients';
import { HeroGraphic } from './_components/graphic/graphic';
import { Badge } from '@/components/ui/badge';

export default function McpPage() {
  return (
    <Body className="max-w-lg mx-auto">
      <div className="flex flex-col gap-4 items-center justify-center text-center">
        <Badge className="bg-primary/10 text-primary border-primary/60 hover:bg-primary/20">
          Now Available
        </Badge>
        <h1 className="text-5xl font-bold font-mono">x402scan MCP</h1>
        <p>
          Make paid API requests to any x402 endpoint from Claude Code, Cursor,
          and more.
        </p>
      </div>
      <HeroGraphic />
      <CopyCode
        code={'npx -y @x402scan/mcp install'}
        toastMessage="MCP Server URL copied to clipboard"
        className="bg-primary/10"
        copyButtonClassName="bg-transparent hover:bg-primary/20 shadow-none border-0"
      />
      <TextSeparator
        text="or install on your client"
        textClassName="text-muted-foreground/50"
      />
      <Clients />
    </Body>
  );
}
