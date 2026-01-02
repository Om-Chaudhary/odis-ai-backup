/**
 * Table header components for different view modes
 */

interface HeaderProps {
  isCompact?: boolean;
}

export function CallsHeader({ isCompact = false }: HeaderProps) {
  return (
    <tr className="text-xs text-slate-500">
      <th
        className={`h-10 pl-3 text-left font-medium ${isCompact ? "w-[40%]" : "w-[32%]"}`}
      >
        Caller
      </th>
      <th
        className={`h-10 text-center font-medium ${isCompact ? "w-[25%]" : "w-[20%]"}`}
      >
        Outcome
      </th>
      <th
        className={`h-10 text-center font-medium ${isCompact ? "w-[18%]" : "w-[14%]"}`}
      >
        Duration
      </th>
      {!isCompact && (
        <th className="h-10 w-[22%] pr-3 text-right font-medium">Date/Time</th>
      )}
    </tr>
  );
}

export function AppointmentsHeader({ isCompact = false }: HeaderProps) {
  return (
    <tr className="text-xs text-slate-500">
      <th
        className={`h-10 pl-3 text-left font-medium ${isCompact ? "w-[50%]" : "w-[40%]"}`}
      >
        Caller
      </th>
      <th
        className={`h-10 text-center font-medium ${isCompact ? "w-[50%]" : "w-[30%]"}`}
      >
        Status
      </th>
      {!isCompact && (
        <th className="h-10 w-[30%] pr-3 text-right font-medium">Date/Time</th>
      )}
    </tr>
  );
}
