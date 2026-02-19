import { ClientInstallHeader } from '../_components/header';

import { ClaudeAccordion } from './_components/accordion';

import { Clients } from '@/app/mcp/_lib/clients';

import { mcpSearchParamsSchema } from '@/app/mcp/_lib/params';

export default async function ClaudePage({
  searchParams,
}: PageProps<'/mcp/install/claude'>) {
  const parsedSearchParams = mcpSearchParamsSchema.safeParse(
    await searchParams
  );

  return (
    <>
      <ClientInstallHeader client={Clients.Claude} />
      <ClaudeAccordion {...parsedSearchParams.data} />
    </>
  );
}
