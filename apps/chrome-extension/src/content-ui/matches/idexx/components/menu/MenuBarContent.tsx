import { InsertNoteButton } from "./InsertNoteButton";
import { LoadingMenuBar } from "./LoadingMenuBar";
import { SendDischargeButton } from "./SendDischargeButton";
import { UnauthenticatedMenuBar } from "./UnauthenticatedMenuBar";
import { DashboardLinkIcon } from "../icons/DashboardLinkIcon";
import {
  EmailIcon,
  PhoneIcon,
  ContactWarningIcon,
  UrgentCaseWarningIcon,
} from "../icons/ScheduleStatusIcons";
import { AuthGuard } from "@odis-ai/extension/shared";
import type { PatientWithCase } from "../../types";
import type { CommunicationStatus } from "../icons/ScheduleStatusIcons";

interface ScheduleStatus {
  hasScheduledEmail: boolean;
  hasScheduledCall: boolean;
  emailStatus: CommunicationStatus;
  callStatus: CommunicationStatus;
  caseId: string | null;
  isLoading: boolean;
  error: string | null;
  missingEmail: boolean;
  missingPhone: boolean;
  isUrgent: boolean;
  urgentReason: string | null;
}

interface MenuBarContentProps {
  selectedPatient: PatientWithCase | null;
  selectedPatientHasNotes: boolean | null;
  isInsertingNote: boolean;
  scheduleStatus: ScheduleStatus;
  consultationId: string | null;
  onInsertNote: () => void;
  onSendDischarge: () => void;
}

/**
 * Get communication status from schedule status
 */
const getEmailStatus = (scheduleStatus: ScheduleStatus): CommunicationStatus =>
  scheduleStatus.emailStatus;

const getCallStatus = (scheduleStatus: ScheduleStatus): CommunicationStatus =>
  scheduleStatus.callStatus;

/**
 * Alert icon for errors/warnings
 */
const AlertIcon = ({ hasError }: { hasError: boolean }) => {
  if (!hasError) return null;

  return (
    <span title="There was an error" className="inline-flex items-center">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="#ef4444"
        stroke="none"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0V9zm-.75 7.5a1 1 0 100 2 1 1 0 000-2z"
        />
      </svg>
    </span>
  );
};

export const MenuBarContent = ({
  selectedPatient,
  selectedPatientHasNotes,
  isInsertingNote,
  scheduleStatus,
  consultationId,
  onInsertNote,
  onSendDischarge,
}: MenuBarContentProps) => {
  const emailStatus = getEmailStatus(scheduleStatus);
  const callStatus = getCallStatus(scheduleStatus);
  const isDischargeDisabled = !consultationId || scheduleStatus.isLoading;

  return (
    <div className="odis-menu-content relative flex items-center gap-2">
      <AuthGuard
        fallback={<UnauthenticatedMenuBar />}
        loadingComponent={<LoadingMenuBar />}
      >
        {/* Insert Note Button (patient auto-selected based on consultation) */}
        <InsertNoteButton
          selectedPatient={selectedPatient}
          isInsertingNote={isInsertingNote}
          hasNotes={selectedPatientHasNotes}
          onInsert={onInsertNote}
        />

        {/* Send Discharge Button */}
        <SendDischargeButton
          isDisabled={isDischargeDisabled}
          onSendDischarge={onSendDischarge}
        />

        {/* Schedule Status Icons */}
        <div className="flex items-center gap-1.5">
          {/* Email position: show warning if missing email, otherwise show email icon */}
          {scheduleStatus.missingEmail ? (
            <ContactWarningIcon
              missingEmail={true}
              missingPhone={false}
              size={18}
              variant="menubar"
            />
          ) : (
            <EmailIcon status={emailStatus} size={18} variant="menubar" />
          )}
          {/* Phone position: show warning if missing phone, otherwise show phone icon */}
          {scheduleStatus.missingPhone ? (
            <ContactWarningIcon
              missingEmail={false}
              missingPhone={true}
              size={18}
              variant="menubar"
            />
          ) : (
            <PhoneIcon status={callStatus} size={18} variant="menubar" />
          )}
          {/* Urgent case warning icon */}
          <UrgentCaseWarningIcon
            isUrgent={scheduleStatus.isUrgent}
            urgentReason={scheduleStatus.urgentReason}
            size={18}
            variant="menubar"
          />
          {scheduleStatus.caseId && (
            <DashboardLinkIcon caseId={scheduleStatus.caseId} size={18} />
          )}
        </div>

        {/* Alert Icon for errors */}
        <AlertIcon hasError={!!scheduleStatus.error} />
      </AuthGuard>
    </div>
  );
};
