"use client";

import {
  CallDetail,
  AppointmentDetail,
  MessageDetail,
  EmptyDetailState,
} from "./detail";
import type { Database } from "@odis-ai/shared/types";
import type {
  ViewMode,
  AppointmentRequest,
  ClinicMessage,
  InboundItem,
} from "./types";

// Use Database type for InboundCall
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface InboundDetailProps {
  item: InboundItem | null;
  viewMode: ViewMode;
  onConfirmAppointment: (
    id: string,
    confirmedDate?: string,
    confirmedTime?: string,
  ) => Promise<void>;
  onRejectAppointment: (id: string, notes?: string) => Promise<void>;
  onMarkMessageRead: (id: string) => Promise<void>;
  onResolveMessage: (id: string) => Promise<void>;
  onDeleteCall?: (id: string) => Promise<void>;
  onDeleteAppointment?: (id: string) => Promise<void>;
  onDeleteMessage?: (id: string) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Inbound Detail Panel (Refactored)
 *
 * Shows full details for the selected item with action buttons:
 * - Calls: Full transcript, recording, analysis
 * - Appointments: Full details with confirm/reject actions
 * - Messages: Full message with mark read/resolve actions
 */
export function InboundDetail({
  item,
  viewMode,
  onConfirmAppointment,
  onRejectAppointment,
  onMarkMessageRead,
  onResolveMessage,
  onDeleteCall,
  onDeleteAppointment,
  onDeleteMessage,
  isSubmitting,
}: InboundDetailProps) {
  if (!item) {
    return <EmptyDetailState viewMode={viewMode} />;
  }

  return (
    <div className="flex h-full flex-col">
      {viewMode === "calls" && (
        <CallDetail
          call={item as InboundCall}
          onDelete={onDeleteCall}
          isSubmitting={isSubmitting}
        />
      )}
      {viewMode === "appointments" && (
        <AppointmentDetail
          appointment={item as AppointmentRequest}
          onConfirm={onConfirmAppointment}
          onReject={onRejectAppointment}
          onDelete={onDeleteAppointment}
          isSubmitting={isSubmitting}
        />
      )}
      {viewMode === "messages" && (
        <MessageDetail
          message={item as ClinicMessage}
          onMarkRead={onMarkMessageRead}
          onResolve={onResolveMessage}
          onDelete={onDeleteMessage}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
