/**
 * Table header components for different view modes
 */

export function CallsHeader() {
  return (
    <tr className="text-muted-foreground text-xs">
      <th className="h-10 w-[30%] pl-4 text-left font-medium">Caller</th>
      <th className="h-10 w-[15%] text-center font-medium">Status</th>
      <th className="h-10 w-[15%] text-center font-medium">Alerts</th>
      <th className="h-10 w-[15%] text-center font-medium">Duration</th>
      <th className="h-10 w-[25%] pr-4 text-right font-medium">Date/Time</th>
    </tr>
  );
}

export function AppointmentsHeader() {
  return (
    <tr className="text-muted-foreground text-xs">
      <th className="h-10 w-[25%] pl-4 text-left font-medium">
        Patient / Client
      </th>
      <th className="h-10 w-[12%] text-left font-medium">Species</th>
      <th className="h-10 w-[20%] text-left font-medium">Reason</th>
      <th className="h-10 w-[12%] text-center font-medium">Status</th>
      <th className="h-10 w-[16%] text-center font-medium">Actions</th>
      <th className="h-10 w-[15%] pr-4 text-right font-medium">Appt Date</th>
    </tr>
  );
}

export function MessagesHeader() {
  return (
    <tr className="text-muted-foreground text-xs">
      <th className="h-10 w-[20%] pl-4 text-left font-medium">Caller</th>
      <th className="h-10 w-[35%] text-left font-medium">Message</th>
      <th className="h-10 w-[10%] text-center font-medium">Priority</th>
      <th className="h-10 w-[10%] text-center font-medium">Status</th>
      <th className="h-10 w-[12%] text-center font-medium">Actions</th>
      <th className="h-10 w-[13%] pr-4 text-right font-medium">Date/Time</th>
    </tr>
  );
}
