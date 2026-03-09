import type { RouterOutputs } from '@/trpc/client';
import { CopyCode } from '@/components/ui/copy-code';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  origin: NonNullable<RouterOutputs['public']['origins']['get']>;
}

export const AgentCashCTA: React.FC<Props> = ({ origin }) => {
  return (
    <div className="flex flex-col gap-2">
      <a
        href="https://agentcash.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold underline-offset-4 hover:underline hover:text-primary/80 transition-colors"
      >
        Try in AgentCash
      </a>
      <p className="text-xs text-muted-foreground">
        Use the AgentCash CLI to call any X402-protected API with automatic payment.
      </p>
      <CopyCode
        code={`npx agentcash try ${origin.origin}`}
        toastMessage="Command copied!"
      />
    </div>
  );
};

export const LoadingAgentCashCTA = () => {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="w-32 h-[20px]" />
      <Skeleton className="w-64 h-[14px]" />
      <Skeleton className="w-full h-[34px]" />
    </div>
  );
};
