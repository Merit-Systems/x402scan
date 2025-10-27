import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/client';
import { AlertDialogDescription } from '@radix-ui/react-alert-dialog';
import { Info } from 'lucide-react';
import { toast } from 'sonner';

export const Acknowledgement = () => {
  const utils = api.useUtils();

  const { data: hasUserAcknowledgedComposer } =
    api.user.acknowledgements.hasAcknowledged.useQuery();

  const { mutate: upsertAcknowledgement } =
    api.user.acknowledgements.upsert.useMutation();

  const onConfirm = () => {
    upsertAcknowledgement(undefined, {
      onSuccess: () => {
        void utils.user.acknowledgements.hasAcknowledged.invalidate();
        toast.success('Acknowledgement confirmed');
      },
    });
  };

  return (
    <AlertDialog open={!hasUserAcknowledgedComposer}>
      <AlertDialogContent className="p-0 overflow-hidden gap-0">
        <AlertDialogHeader className="bg-muted border-b p-4">
          <div className="flex flex-row items-center gap-2">
            <Info className="size-4" />
            <AlertDialogTitle>
              You Have Used All of Your Free x402 Credits
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-mono">
            You will need to find your agent with USDC to continue using the
            composer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="m-4 flex flex-col gap-2 bg-yellow-600/10 border border-yellow-600 p-4 rounded-md">
          <p className="font-bold">
            x402scan Composer is an Experimental Project
          </p>
          <p className="text-sm">
            Do not add any funds you are not willing to lose.
          </p>
          <p className="text-sm">
            Composer agents run in a server that has full control over funds
            added to the agent&apos;s server wallet.
          </p>
          <p className="text-sm font-semibold">
            You must acknowledge that you understand before proceeding.
          </p>
        </div>
        <AlertDialogFooter className="border-t p-4 bg-muted">
          <Button onClick={onConfirm} className="w-full">
            Confirm and Proceed
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
