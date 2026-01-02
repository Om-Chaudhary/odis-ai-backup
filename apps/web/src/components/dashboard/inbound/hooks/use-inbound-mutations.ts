/**
 * Custom hook for inbound data mutations
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/client";

interface UseInboundMutationsOptions {
  onAppointmentSuccess?: () => void;
  onCallSuccess?: () => void;
}

/**
 * Hook for managing inbound mutations (updates, deletes)
 */
export function useInboundMutations(options: UseInboundMutationsOptions = {}) {
  const { onAppointmentSuccess, onCallSuccess } = options;

  // Mutations
  const updateAppointment = api.inbound.updateAppointmentRequest.useMutation({
    onSuccess: () => {
      toast.success("Appointment updated");
      onAppointmentSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to update appointment", {
        description: error.message,
      });
    },
  });

  const deleteCall = api.inboundCalls.deleteInboundCall.useMutation({
    onSuccess: () => {
      toast.success("Call deleted");
      onCallSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to delete call", { description: error.message });
    },
  });

  const deleteAppointment = api.inbound.deleteAppointmentRequest.useMutation({
    onSuccess: () => {
      toast.success("Appointment deleted");
      onAppointmentSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to delete appointment", {
        description: error.message,
      });
    },
  });

  // Action handlers
  const handleConfirmAppointment = useCallback(
    async (id: string, confirmedDate?: string, confirmedTime?: string) => {
      await updateAppointment.mutateAsync({
        id,
        status: "confirmed",
        confirmedDate,
        confirmedTime,
      });
    },
    [updateAppointment],
  );

  const handleRejectAppointment = useCallback(
    async (id: string, notes?: string) => {
      await updateAppointment.mutateAsync({
        id,
        status: "rejected",
        notes,
      });
    },
    [updateAppointment],
  );

  const handleDeleteCall = useCallback(
    async (id: string) => {
      await deleteCall.mutateAsync({ id });
    },
    [deleteCall],
  );

  const handleDeleteAppointment = useCallback(
    async (id: string) => {
      await deleteAppointment.mutateAsync({ id });
    },
    [deleteAppointment],
  );

  const isSubmitting =
    updateAppointment.isPending ||
    deleteCall.isPending ||
    deleteAppointment.isPending;

  return {
    // Mutations
    updateAppointment,
    deleteCall,
    deleteAppointment,
    // Action handlers
    handleConfirmAppointment,
    handleRejectAppointment,
    handleDeleteCall,
    handleDeleteAppointment,
    // State
    isSubmitting,
  };
}
