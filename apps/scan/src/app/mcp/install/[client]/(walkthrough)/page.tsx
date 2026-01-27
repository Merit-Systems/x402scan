import { notFound } from 'next/navigation';

import { ClientInstallHeader } from '@/app/mcp/install/_components/header';

import { ClientInstallAccordion } from './_components/accordion';

import { clientSchema } from '@/app/mcp/_lib/clients';
import { mcpSearchParamsSchema } from '@/app/mcp/_lib/params';

export default async function InstallClientPage({
  params,
  searchParams,
}: PageProps<'/mcp/install/[client]'>) {
  const { client } = await params;

  const parsedClient = clientSchema.safeParse(client);
  if (!parsedClient.success) {
    notFound();
  }

  const parsedSearchParams = mcpSearchParamsSchema.safeParse(
    await searchParams
  );

  return (
    <>
      <ClientInstallHeader client={parsedClient.data} />
      <ClientInstallAccordion
        client={parsedClient.data}
        {...parsedSearchParams.data}
      />
    </>
  );
}
