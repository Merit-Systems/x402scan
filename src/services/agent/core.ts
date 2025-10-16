import { createX402OpenAI } from '@merit-systems/ai-x402/server';
import { stepCountIs, streamText, convertToModelMessages } from 'ai';
import type { UIMessage, Tool } from 'ai';
import type { Signer } from 'x402-fetch';
import { createX402AITools } from './get-tools';

export const getSelectedTools = async (
  walletClient: Signer,
  tools: string[]
): Promise<Record<string, Tool>> => {
  const allTools = await createX402AITools(walletClient);

  return Object.fromEntries(tools.map(tool => [tool, allTools[tool]]));
};

export async function InvokeAgent(
  model: string,
  walletClient: Signer,
  messages: UIMessage[],
  selectedTools: Record<string, Tool>
) {
  const x402 = createX402OpenAI(walletClient);
  const result = streamText({
    model: x402(model),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(50),
    tools: selectedTools,
  });
  return result;
}
