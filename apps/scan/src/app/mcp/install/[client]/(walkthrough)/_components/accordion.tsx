import { clientInstall } from './install';
import { CopyCommand } from './copy-command';

import { Accordion } from '../../../_components/accordion';

import type { Clients } from '@/app/mcp/_lib/clients';
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
      title: 'Run CLI Command',
      content: (
        <div className="flex flex-col gap-2">
          <CopyCommand
            title="Quick Install"
            command={`npx @x402scan/mcp install --client ${client}${props.invite ? ` --invite ${props.invite}` : ''}`}
          />
          {InstallComponent && <InstallComponent {...props} />}
        </div>
      ),
      continueText: 'Next',
    },
  ];

  return <Accordion steps={steps} client={client} />;
};
