import { CodeCard } from "@/components/ui/code-card";
import { AGENT_PROMPT } from "../../_constants/prompts";

export function QuickstartPromptCard() {
  return (
    <CodeCard
      code={AGENT_PROMPT}
      codeClassName="text-wrap whitespace-pre-wrap"
      copyLabel="Copy prompt"
    />
  );
}
