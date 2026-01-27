import { CopyButton } from '@/components/ui/copy-button';

interface Props {
  prompt: string;
}

export const CopyPrompt: React.FC<Props> = ({ prompt }) => {
  return (
    <div className="bg-muted p-2 pl-4 rounded-lg flex justify-between items-center gap-2 border">
      <p>{prompt}</p>
      <CopyButton text={prompt} />
    </div>
  );
};
