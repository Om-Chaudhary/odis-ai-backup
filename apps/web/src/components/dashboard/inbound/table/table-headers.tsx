/**
 * Table header components for different view modes
 */

interface HeaderProps {
  isCompact?: boolean;
}

export function CallsHeader({ isCompact = false }: HeaderProps) {
  return (
    <tr className="text-muted-foreground text-xs">
      <th
        className={`h-10 pl-3 text-left font-medium ${isCompact ? "w-[40%]" : "w-[32%]"}`}
      >
        Caller
      </th>
      <th
        className={`h-10 text-center font-medium ${isCompact ? "w-[20%]" : "w-[14%]"}`}
      >
        Status
      </th>
      <th
        className={`h-10 text-center font-medium ${isCompact ? "w-[18%]" : "w-[12%]"}`}
      >
        Alerts
      </th>
      <th
        className={`h-10 text-center font-medium ${isCompact ? "w-[22%]" : "w-[14%]"}`}
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
    <tr className="text-muted-foreground text-xs">
      <th
        className={`h-10 pl-3 text-left font-medium ${isCompact ? "w-[38%]" : "w-[26%]"}`}
      >
        Patient / Client
      </th>
      <th
        className={`h-10 text-left font-medium ${isCompact ? "w-[20%]" : "w-[14%]"}`}
      >
        Species
      </th>
      <th
        className={`h-10 text-left font-medium ${isCompact ? "w-[22%]" : "w-[18%]"}`}
      >
        Reason
      </th>
      <th
        className={`h-10 text-center font-medium ${isCompact ? "w-[20%]" : "w-[12%]"}`}
      >
        Status
      </th>
      {!isCompact && (
        <th className="h-10 w-[14%] text-center font-medium">Actions</th>
      )}
      {!isCompact && (
        <th className="h-10 w-[14%] pr-3 text-right font-medium">Appt Date</th>
      )}
    </tr>
  );
}

export function MessagesHeader({ isCompact = false }: HeaderProps) {
  return (
    <tr className="text-muted-foreground text-xs">
      <th
        className={`h-10 pl-3 text-left font-medium ${isCompact ? "w-[28%]" : "w-[18%]"}`}
      >
        Caller
      </th>
      <th
        className={`h-10 text-left font-medium ${isCompact ? "w-[38%]" : "w-[34%]"}`}
      >
        Message
      </th>
      <th
        className={`h-10 text-center font-medium ${isCompact ? "w-[16%]" : "w-[12%]"}`}
      >
        Priority
      </th>
      <th
        className={`h-10 text-center font-medium ${isCompact ? "w-[18%]" : "w-[12%]"}`}
      >
        Status
      </th>
      {!isCompact && (
        <th className="h-10 w-[12%] text-center font-medium">Actions</th>
      )}
      {!isCompact && (
        <th className="h-10 w-[12%] pr-3 text-right font-medium">Date/Time</th>
      )}
    </tr>
  );
}
