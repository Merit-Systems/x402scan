import { Terminal } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { CopyCode } from '@/components/ui/copy-code';

interface Props {
  originUrl: string;
}

export const AgentCashCTA: React.FC<Props> = ({ originUrl }) => {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Try in AgentCash</p>
        </div>
        <a
          href="https://agentcash.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:underline"
        >
          agentcash.dev
        </a>
      </div>
      <p className="text-xs text-muted-foreground">
        Use the AgentCash CLI to call any X402-protected API with automatic payment.
      </p>
      <CopyCode
        code={`npx agentcash try ${originUrl}`}
        toastMessage="Command copied!"
      />
    </Card>
  );
};
