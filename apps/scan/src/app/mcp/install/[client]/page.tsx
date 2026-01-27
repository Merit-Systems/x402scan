import { notFound } from 'next/navigation';

import { clientSchema } from '../../_lib/clients';
import { ClientInstallHeader } from '../_components/header';

export default async function InstallClientPage({
  params,
}: PageProps<'/mcp/install/[client]'>) {
  const { client } = await params;

  const parsedClient = clientSchema.safeParse(client);
  if (!parsedClient.success) {
    notFound();
  }

  return (
    <>
      <ClientInstallHeader client={parsedClient.data} />
    </>
  );
}
