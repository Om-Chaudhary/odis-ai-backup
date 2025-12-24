import { MenuBarContent } from "./MenuBarContent";
import { useModalDetection } from "../../hooks/menu/useModalDetection";
import { useNoteInsertion } from "../../hooks/notes/useNoteInsertion";
import { usePatientSelection } from "../../hooks/patient/usePatientSelection";
import { useConsultationId } from "../../hooks/useConsultationId";
import { useConsultationScheduleStatus } from "../../hooks/useConsultationScheduleStatus";
import { cn } from "@odis-ai/shared/ui/extension";
import { useCallback } from "react";
import type { CKEditorInfo } from "../../utils/dom/ckeditor-detector";

interface BrandedMenuBarProps {
  ckeditorInfo: CKEditorInfo;
}

export const BrandedMenuBar = ({ ckeditorInfo }: BrandedMenuBarProps) => {
  const shouldHideForModal = useModalDetection();

  // Get consultation ID from URL - reactive to SPA navigation
  const consultationId = useConsultationId();

  // Patient selection now uses consultationId for primary lookup
  // Auto-selects patient only if case has transcriptions
  const { selectedPatient, selectedPatientHasNotes } =
    usePatientSelection(consultationId);
  const { isInsertingNote, insertNote } = useNoteInsertion(ckeditorInfo);

  // Fetch scheduling status for the current consultation
  const scheduleStatus = useConsultationScheduleStatus(consultationId);

  // Open dashboard outbound page for discharge using consultation ID
  const handleOpenDashboard = useCallback(() => {
    if (consultationId) {
      const baseUrl = "https://odisai.net";
      const dashboardUrl = `${baseUrl}/dashboard/outbound?consultationId=${consultationId}`;
      window.open(dashboardUrl, "_blank");
    }
  }, [consultationId]);

  const handleInsertNote = () => {
    insertNote(selectedPatient);
  };

  return (
    <div
      className={cn(
        "ml-auto flex items-center justify-end font-sans",
        // If we are hiding for modal, make it invisible but keep in DOM to avoid unmounting
        shouldHideForModal && "pointer-events-none invisible opacity-0",
      )}
      style={{
        zIndex: 100,
      }}
    >
      <MenuBarContent
        selectedPatient={selectedPatient}
        selectedPatientHasNotes={selectedPatientHasNotes}
        isInsertingNote={isInsertingNote}
        scheduleStatus={scheduleStatus}
        consultationId={consultationId}
        onInsertNote={handleInsertNote}
        onSendDischarge={handleOpenDashboard}
      />
    </div>
  );
};
