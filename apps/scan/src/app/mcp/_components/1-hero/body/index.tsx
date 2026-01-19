import { CopyCommandButton } from '../../lib/copy-button';
import { ClientSelect } from './client-select';

export const HeroBody = () => {
  return (
    <div className="flex flex-col justify-center gap-8">
      <div className="flex flex-col gap-6 justify-center">
        <h1 className="text-5xl font-semibold">x402scan MCP</h1>
        <p className="text-lg text-muted-foreground/60 font-mono max-w-md">
          Give your agents the ability to make paid API requests to any x402
          endpoint.
        </p>
      </div>
      <div className="flex gap-4 justify-start">
        <ClientSelect />
        <CopyCommandButton />
      </div>
    </div>
  );
};
