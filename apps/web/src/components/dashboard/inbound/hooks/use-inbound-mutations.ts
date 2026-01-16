/**
 * Custom hook for inbound call mutations
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/client";

interface UseInboundMutationsOptions {
  onCallSuccess?: () => void;
}

/**
 * Hook for managing inbound call mutations (deletes)
 */
export function useInboundMutations(options: UseInboundMutationsOptions = {}) {
  const { onCallSuccess } = options;
  const utils = api.useUtils();

  const deleteCall = api.inboundCalls.deleteInboundCall.useMutation({
    onSuccess: () => {
      toast.success("Call deleted");

      // Invalidate queries to refetch data
      void utils.inboundCalls.listInboundCalls.invalidate();
      void utils.inbound.getInboundStats.invalidate();

      onCallSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to delete call", { description: error.message });
    },
  });

  const handleDeleteCall = useCallback(
    async (id: string) => {
      await deleteCall.mutateAsync({ id });
    },
    [deleteCall],
  );

  const isSubmitting = deleteCall.isPending;

  return {
    deleteCall,
    handleDeleteCall,
    isSubmitting,
  };
}
