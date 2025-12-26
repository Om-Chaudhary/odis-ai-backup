/**
 * Custom hook for inbound data mutations
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/client";

interface UseInboundMutationsOptions {
  onAppointmentSuccess?: () => void;
  onMessageSuccess?: () => void;
  onCallSuccess?: () => void;
}

/**
 * Hook for managing inbound mutations (updates, deletes)
 */
export function useInboundMutations(options: UseInboundMutationsOptions = {}) {
  const { onAppointmentSuccess, onMessageSuccess, onCallSuccess } = options;

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

  const updateMessage = api.inbound.updateClinicMessage.useMutation({
    onSuccess: () => {
      toast.success("Message updated");
      onMessageSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to update message", { description: error.message });
    },
  });

  const markRead = api.inbound.markMessageRead.useMutation({
    onSuccess: () => {
      toast.success("Marked as read");
      onMessageSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to mark as read", { description: error.message });
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

  const deleteMessage = api.inbound.deleteClinicMessage.useMutation({
    onSuccess: () => {
      toast.success("Message deleted");
      onMessageSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to delete message", { description: error.message });
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

  const handleMarkMessageRead = useCallback(
    async (id: string) => {
      await markRead.mutateAsync({ id });
    },
    [markRead],
  );

  const handleResolveMessage = useCallback(
    async (id: string) => {
      await updateMessage.mutateAsync({
        id,
        status: "resolved",
      });
    },
    [updateMessage],
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

  const handleDeleteMessage = useCallback(
    async (id: string) => {
      await deleteMessage.mutateAsync({ id });
    },
    [deleteMessage],
  );

  const isSubmitting =
    updateAppointment.isPending ||
    updateMessage.isPending ||
    markRead.isPending ||
    deleteCall.isPending ||
    deleteAppointment.isPending ||
    deleteMessage.isPending;

  return {
    // Mutations
    updateAppointment,
    updateMessage,
    markRead,
    deleteCall,
    deleteAppointment,
    deleteMessage,
    // Action handlers
    handleConfirmAppointment,
    handleRejectAppointment,
    handleMarkMessageRead,
    handleResolveMessage,
    handleDeleteCall,
    handleDeleteAppointment,
    handleDeleteMessage,
    // State
    isSubmitting,
  };
}
