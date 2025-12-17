import { cn } from '@odis-ai/ui/extension';
import type { PatientWithCase } from '../../types';

interface InsertNoteButtonProps {
  selectedPatient: PatientWithCase | null;
  isInsertingNote: boolean;
  hasNotes: boolean | null;
  onInsert: () => void;
}

export const InsertNoteButton = ({ selectedPatient, isInsertingNote, hasNotes, onInsert }: InsertNoteButtonProps) => {
  const isDisabled = !selectedPatient || isInsertingNote || hasNotes === false;
  const patientName = selectedPatient?.name || 'Patient';

  const getTitle = () => {
    if (!selectedPatient) return 'Select a patient first';
    if (hasNotes === false) return `No case found for ${patientName}`;
    if (hasNotes === null) return 'Checking for notes...';
    return `Insert ${patientName}'s most recent SOAP note`;
  };

  return (
    <button
      className={cn(
        'inline-flex items-center gap-1.5 rounded border border-teal-500 bg-teal-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200',
        'hover:border-teal-600 hover:bg-teal-600',
        'active:bg-teal-700',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
      onClick={onInsert}
      disabled={isDisabled}
      title={getTitle()}
      type="button">
      {/* Edit/Note icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      <span className="max-w-[100px] truncate">{isInsertingNote ? 'Inserting...' : patientName}</span>
    </button>
  );
};
