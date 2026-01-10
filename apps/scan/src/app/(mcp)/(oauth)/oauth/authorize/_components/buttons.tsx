'use client';

import React, { useActionState } from 'react';

import { Button } from '@/components/ui/button';

import { authorize } from '../_actions/authorize';

import type { authorizeParamsSchema } from '@/app/(mcp)/_lib/auth-code';
import type z from 'zod';

interface Props {
  params: z.infer<typeof authorizeParamsSchema>;
}

export const AuthorizeButtons: React.FC<Props> = ({ params }) => {
  const [state, action, pending] = useActionState(
    async () => await authorize(params),
    null
  );

  const denyUrl = new URL(params.redirect_uri);
  denyUrl.searchParams.set('error', 'access_denied');
  denyUrl.searchParams.set('error_description', 'User denied authorization');
  if (params.state) {
    denyUrl.searchParams.set('state', params.state);
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex gap-2 w-full">
        <a href={denyUrl.toString()} className="flex-1">
          <Button
            variant="outline"
            className="w-full"
            disabled={pending}
            size="lg"
          >
            Cancel
          </Button>
        </a>
        <form action={action} className="flex-1">
          <Button type="submit" disabled={pending} className="w-full" size="lg">
            {pending ? 'Approving...' : 'Approve'}
          </Button>
        </form>
      </div>
      {state?.error && (
        <div className="text-red-500">{state.error_description}</div>
      )}
    </div>
  );
};
