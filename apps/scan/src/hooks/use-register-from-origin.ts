'use client';

import { api } from '@/trpc/client';
import { toast } from 'sonner';

export interface RegisterFromOriginSuccessData {
  registered: number;
  failed: number;
  skipped: number;
  deprecated?: number;
  total: number;
  failedDetails?: { url: string; error: string; status?: number }[];
  skippedDetails?: { url: string; error: string; status?: number }[];
  originId?: string;
}

export interface UseRegisterFromOriginOptions {
  showToasts?: boolean;
  onMutate?: () => void;
  onSuccess?: (data: RegisterFromOriginSuccessData) => void;
  onError?: (error?: Error) => void;
}

export function useRegisterFromOrigin(
  options: UseRegisterFromOriginOptions = {}
) {
  const { showToasts = false, onMutate, onSuccess, onError } = options;
  const utils = api.useUtils();

  const mutation = api.public.resources.registerFromOrigin.useMutation({
    onMutate: () => {
      onMutate?.();
    },
    onSuccess: data => {
      if (!data.success) {
        const errorMessage =
          'error' in data ? data.error.message : 'Discovery failed';
        if (showToasts) {
          toast.error('Refresh failed', { description: errorMessage });
        }
        onError?.();
        return;
      }

      void utils.public.resources.list.invalidate();
      void utils.public.origins.list.withResources.invalidate();
      void utils.public.sellers.bazaar.list.invalidate();

      if (showToasts) {
        const parts: string[] = [];
        if (data.registered > 0) parts.push(`${data.registered} registered`);
        if (data.deprecated > 0) parts.push(`${data.deprecated} removed`);
        if (data.skipped > 0) parts.push(`${data.skipped} skipped`);
        if (data.failed > 0) parts.push(`${data.failed} failed`);
        const description =
          parts.length > 0 ? parts.join(', ') : 'Server is up to date';
        toast.success('Server refreshed', { description });
      }

      onSuccess?.({
        registered: data.registered,
        failed: data.failed,
        skipped: data.skipped,
        deprecated: data.deprecated,
        total: data.total,
        failedDetails: data.failedDetails,
        skippedDetails: data.skippedDetails,
        originId: data.originId,
      });
    },
    onError: error => {
      if (showToasts) {
        toast.error('Refresh failed', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    },
  });

  const register = (origin: string) => mutation.mutateAsync({ origin });

  const error =
    mutation.data && !mutation.data.success
      ? 'error' in mutation.data
        ? mutation.data.error.message
        : 'Discovery failed'
      : mutation.error
        ? mutation.error instanceof Error
          ? mutation.error.message
          : 'Failed to register resources'
        : null;

  return {
    register,
    isRegistering: mutation.isPending,
    data: mutation.data?.success ? mutation.data : null,
    error,
    reset: mutation.reset,
  };
}
