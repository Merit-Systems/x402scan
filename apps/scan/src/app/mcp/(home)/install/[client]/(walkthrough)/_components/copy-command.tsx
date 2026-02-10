import { CopyCode } from '@/components/ui/copy-code';

interface Props {
  title: string;
  command: string;
}

export const CopyCommand: React.FC<Props> = ({ title, command }) => {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium">{title}</p>
      <CopyCode
        code={command}
        toastMessage="Command copied to clipboard"
        className="w-full"
        copyButtonClassName="bg-transparent shadow-none border-0"
        textClassName="text-xs"
      />
    </div>
  );
};
