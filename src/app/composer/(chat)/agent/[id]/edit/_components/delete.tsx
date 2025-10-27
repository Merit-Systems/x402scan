'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/trpc/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  agentId: string;
}

export const DeleteAgentButton: React.FC<Props> = ({ agentId }) => {
  const router = useRouter();

  const { mutate: deleteAgent, isPending } =
    api.user.agentConfigurations.delete.useMutation({
      onSuccess: () => {
        toast.success('Agent deleted successfully');
        router.push('/composer');
      },
      onError: () => {
        toast.error('Failed to delete agent');
      },
    });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructiveOutline">Delete Agent</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Agent</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this agent?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteAgent(agentId)}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
