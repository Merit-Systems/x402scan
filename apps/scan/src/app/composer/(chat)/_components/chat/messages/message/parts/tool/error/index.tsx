import { PaymentRequired } from './payment-required';

import { toolPaymentRequiredMessage } from '@/lib/errors';

import type { ToolUIPart } from 'ai';
import type { RouterOutputs } from '@/trpc/client';

interface Props {
  errorText: NonNullable<ToolUIPart['errorText']>;
  isResourceLoading: boolean;
  resource: RouterOutputs['public']['resources']['get'] | undefined;
}

export const ToolError: React.FC<Props> = ({
  errorText,
  isResourceLoading,
  resource,
}) => {
  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="overflow-x-auto rounded-md text-xs [&_table]:w-full font-mono bg-destructive/10 text-destructive">
        <div className="p-3">{errorText}</div>
      </div>
      {errorText === toolPaymentRequiredMessage &&
        !isResourceLoading &&
        resource && <PaymentRequired resource={resource} />}
    </div>
  );
};
