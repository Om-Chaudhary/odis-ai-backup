import { cn } from '@odis-ai/shared/ui/extension';
import type { PatientWithCase } from '../../types';

interface PatientDropdownProps {
  patients: PatientWithCase[] | null;
  selectedPatient: PatientWithCase | null;
  isLoading: boolean;
  onSelectPatient: (patient: PatientWithCase) => void;
}

export const PatientDropdown = ({ patients, selectedPatient, isLoading, onSelectPatient }: PatientDropdownProps) => {
  if (isLoading) {
    return (
      <div className="bg-white/98 border-primary/20 text-foreground animate-in fade-in slide-in-from-top-2 mt-1 w-full overflow-hidden rounded-xl border p-2 shadow-xl backdrop-blur-md">
        <div className="text-muted-foreground px-4 py-8 text-center text-[13px] font-medium">Loading…</div>
      </div>
    );
  }

  if (!patients || patients.length === 0) {
    return (
      <div className="bg-white/98 border-primary/20 text-foreground animate-in fade-in slide-in-from-top-2 mt-1 w-full overflow-hidden rounded-xl border p-2 shadow-xl backdrop-blur-md">
        <div className="text-muted-foreground px-4 py-8 text-center text-[13px] font-medium">No recent patients</div>
      </div>
    );
  }

  return (
    <div
      className="bg-white/98 border-primary/20 text-foreground animate-in fade-in slide-in-from-top-2 mt-1 w-full overflow-hidden rounded-xl border p-2 shadow-xl backdrop-blur-md"
      role="menu">
      <div className="max-h-[380px] overflow-y-auto overflow-x-hidden pr-1">
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {patients.map(patient => {
            const isSelected = selectedPatient?.id === patient.id;
            return (
              <li
                key={patient.id}
                className={cn(
                  'group flex min-h-[32px] cursor-pointer items-center justify-between gap-3 rounded-md border border-transparent px-2.5 py-1.5 transition-all',
                  isSelected
                    ? 'bg-primary/10 border-primary/30 shadow-sm'
                    : 'hover:bg-muted hover:border-muted-foreground/20 hover:shadow-sm',
                )}>
                <button
                  className="flex min-w-0 flex-1 items-center border-none bg-transparent p-0 text-left"
                  onClick={() => onSelectPatient(patient)}>
                  <div className="text-foreground truncate whitespace-nowrap text-[13px] font-semibold leading-none">
                    {patient.name}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
