import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getPendingClaimByLinkToken } from '@/services/claim/session';

import { ConfirmClaim } from './confirm-claim';

export default async function ClaimVerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await searchParams;
  const tokenStr = typeof token === 'string' ? token : undefined;
  const pending = tokenStr ? await getPendingClaimByLinkToken(tokenStr) : null;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>
            {pending ? `Claim ${pending.originHostname}` : 'Link expired'}
          </CardTitle>
          <CardDescription>
            {pending
              ? `Confirm that you control ${pending.maskedEmail} to manage this origin.`
              : 'This claim link is invalid or has expired. Request a new code from the origin page.'}
          </CardDescription>
        </CardHeader>
        {pending && tokenStr ? (
          <CardContent>
            <ConfirmClaim token={tokenStr} originId={pending.originId} />
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
