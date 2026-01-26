import Lottie from 'lottie-react';

import { Clients } from '@/app/mcp/_components/clients/data';
import { ClientIcon } from '@/app/mcp/_components/clients/icons';
import { File } from 'lucide-react';

import doubleTap from './double-tap.json';

export const McpbDisplay: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row gap-2">
      <McpbStep
        title="Open Claude Desktop"
        description="The application needs to be open to install the MCP"
        display={
          <div className="flex flex-col gap-2 items-center">
            <div className="bg-[#c15f3c] p-2 rounded-xl">
              <ClientIcon
                client={Clients.Claude}
                className="size-8 fill-white"
              />
            </div>
            <h3 className="text-xs font-semibold">Claude</h3>
          </div>
        }
      />
      <McpbStep
        title="Open x402.mcpb"
        description={
          <>
            The MCPB file is in your <strong>Downloads folder</strong>
          </>
        }
        display={
          <div className="flex flex-col gap-2 items-center">
            <div className="flex flex-col gap-2 items-center justify-center bg-card border p-2 rounded-xl relative">
              <File className="size-8" />
              <Lottie
                animationData={doubleTap}
                className="absolute bottom-1/3 translate-y-1/2 -right-5 size-8 -rotate-30"
              />
            </div>
            <h3 className="text-xs font-semibold">x402.mcpb</h3>
          </div>
        }
      />
      <McpbStep
        title="Confirm in Claude Desktop"
        description="Press the install button to add the MCP to Claude Desktop"
        display={
          <div className="px-4 py-2 bg-white text-black rounded-xl border font-semibold">
            Install
          </div>
        }
      />
    </div>
  );
};

interface StepProps {
  title: string;
  description: React.ReactNode;
  display: React.ReactNode;
}

const McpbStep: React.FC<StepProps> = ({ title, description, display }) => {
  return (
    <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
      <div className="flex items-center justify-center gap-2 bg-primary/5 p-4 flex-1">
        {display}
      </div>
      <div className="p-2 border-t shrink-0 flex flex-col gap-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};
