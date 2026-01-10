import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

import { AuthorizeButtons } from './_components/buttons';
import { ErrorPage } from './_components/error-card';

import { auth, signIn } from '@/auth';

import { authorizeParamsSchema } from '@/app/(mcp)/_lib/auth-code';

export default async function AuthorizePage({
  searchParams,
}: PageProps<'/oauth/authorize'>) {
  const resolvedParams = await searchParams;
  const parseResult = authorizeParamsSchema.safeParse(resolvedParams);

  if (!parseResult.success) {
    return (
      <ErrorPage
        message={
          <ul className="list-disc list-inside space-y-1 text-sm">
            {parseResult.error.issues.map(err => (
              <li key={err.path.join('.')}>{err.message}</li>
            ))}
          </ul>
        }
        actions={
          typeof resolvedParams.redirect_uri === 'string' ? (
            <a href={resolvedParams.redirect_uri} className="flex-1">
              <Button variant="outline" className="w-full">
                Back to App
              </Button>
            </a>
          ) : (
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          )
        }
      />
    );
  }

  const session = await auth();

  if (!session) {
    return signIn('permi');
  }

  const permiAccount = session.user.accounts.find(
    account => account.provider === 'permi'
  );

  if (!permiAccount) {
    return (
      <div>
        <p>Tell user they will be redirected to Permit to sign in</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-4 bg-card border-b" />
      <div className="flex-1 justify-center items-center flex flex-col gap-4 max-w-sm mx-auto text-center">
        <Logo className="size-12" />
        <h1 className="text-2xl font-bold">Authorize Cursor</h1>
        <p className="text-muted-foreground text-sm">
          A Cursor MCP wants to use your Permi wallet to sign x402 transactions.
        </p>
        <AuthorizeButtons params={parseResult.data} />
      </div>
    </div>
  );
}
