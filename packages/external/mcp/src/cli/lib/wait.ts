import { spinner } from '@clack/prompts';

interface WaitProps {
  startText: string;
  stopText: string;
  ms: number;
}

export const wait = async ({ startText, stopText, ms }: WaitProps) => {
  const { start: startSpinner, stop: stopSpinner } = spinner();
  startSpinner(startText);
  await new Promise(resolve => setTimeout(resolve, ms));
  stopSpinner(stopText);
};
