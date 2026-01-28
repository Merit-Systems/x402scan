import { clientInstall } from './install';
import { CopyCommand } from './copy-command';

import { Accordion } from '../../../_components/accordion';

import { cn } from '@/lib/utils';

import { Clients } from '@/app/mcp/_lib/clients';

import type { McpSearchParams } from '@/app/mcp/_lib/params';
import type { BaseStep } from '../../../_components/accordion/item';

interface Props extends McpSearchParams {
  client: Clients;
}

export const ClientInstallAccordion: React.FC<Props> = ({
  client,
  ...props
}) => {
  const InstallComponent = clientInstall[client];

  const steps: BaseStep[] = [
    {
      title: 'Install MCP',
      content: (
        <div
          className={cn(
            'flex flex-col gap-4',
            client === Clients.Cursor && 'flex-col-reverse gap-4'
          )}
        >
          <CopyCommand
            title={
              client === Clients.Cursor ? 'Manual Install' : 'Quick Install'
            }
            command={`npx @x402scan/mcp install --client ${client}${props.invite ? ` --invite ${props.invite}` : ''}`}
          />
          {InstallComponent && <InstallComponent {...props} />}
        </div>
      ),
      continueText: "I've Installed the MCP",
    },
  ];

  return <Accordion steps={steps} client={client} />;
};
