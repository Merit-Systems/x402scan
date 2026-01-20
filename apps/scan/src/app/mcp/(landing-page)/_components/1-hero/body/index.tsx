import { CopyCommandButton } from '../../lib/copy-button';
import { ClientSelect } from './../../lib/client-select';

interface Props {
  inviteCode?: string;
}

export const HeroBody: React.FC<Props> = ({ inviteCode }) => {
  return (
    <div className="flex flex-col justify-center gap-6 md:gap-8">
      <div className="flex flex-col gap-4 md:gap-6 justify-center">
        <h1 className="text-4xl md:text-5xl font-bold">x402scan MCP</h1>
        <p className="text-md md:text-lg text-muted-foreground/60 font-mono max-w-md">
          Give your agents the ability to make paid API requests to any x402
          endpoint.
        </p>
      </div>
      <div className="flex gap-2 md:gap-4 justify-start items-start md:items-center">
        <ClientSelect inviteCode={inviteCode} />
        <CopyCommandButton
          inviteCode={inviteCode}
          className="flex-1 md:flex-none px-0 md:px-4"
        />
      </div>
    </div>
  );
};
