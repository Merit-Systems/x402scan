import { OnrampMethods, OnrampProviders } from '@/services/onramp/types';
import z from 'zod';
import { notFound } from 'next/navigation';
import { METHODS } from './_components/methods';
import { Body } from '@/app/_components/layout/page-utils';

const paramsSchema = z.object({
  method: z.union([z.literal(OnrampMethods.WALLET), z.enum(OnrampProviders)]),
});

export default async function SuccessPage({
  params,
  searchParams,
}: PageProps<'/deposit/[address]/[method]'>) {
  const parsedParams = paramsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return notFound();
  }

  const { method } = parsedParams.data;

  const Component = METHODS[method];

  return (
    <Body className="max-w-lg mx-auto">
      <Component searchParams={await searchParams} />
    </Body>
  );
}
