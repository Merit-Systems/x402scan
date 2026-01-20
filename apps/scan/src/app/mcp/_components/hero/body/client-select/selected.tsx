import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CopyCode } from '@/components/ui/copy-code';
import { TextSeparator } from '@/components/ui/text-separator';

import { ClientIcon } from '../../../clients/icons';

import { clientInstall } from './client-install';

import { clients } from '../../../clients/data';

import type { Clients as ClientsEnum } from '../../../clients/data';

interface Props {
  client: ClientsEnum;
  reset: () => void;
}

export const SelectedClient: React.FC<Props> = ({ client, reset }) => {
  const ClientInstall = clientInstall[client];
  const { name } = clients[client];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2 shrink-0">
          <ClientIcon
            client={client}
            width={24}
            height={24}
            className="shrink-0"
          />
          <span className="font-medium shrink-0">{name}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="p-1 size-fit md:size-fit"
          onClick={reset}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Quick Install</p>
          <CopyCode
            code={`npx @x402scan/mcp install --client ${client}`}
            toastMessage="MCP install command copied to clipboard"
            className="w-full"
            copyButtonClassName="bg-transparent shadow-none border-0"
            textClassName="text-sm"
          />
        </div>
        <TextSeparator
          text="or"
          separatorClassName="bg-border"
          textClassName="text-muted-foreground"
        />
        <ClientInstall />
      </div>
    </div>
  );
};
