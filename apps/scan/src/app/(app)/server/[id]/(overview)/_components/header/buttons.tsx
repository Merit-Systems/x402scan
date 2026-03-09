import type { RouterOutputs } from '@/trpc/client';
import { AgentCashCTA, LoadingAgentCashCTA } from './agentcash-cta';

interface Props {
  origin: NonNullable<RouterOutputs['public']['origins']['get']>;
}

export const HeaderButtons: React.FC<Props> = ({ origin }) => {
  return <AgentCashCTA origin={origin} />;
};

export const LoadingHeaderButtons = () => {
  return <LoadingAgentCashCTA />;
};
