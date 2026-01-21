/**
 * Table header component for inbound calls
 *
 * Column widths:
 * - Full mode: Caller 28% | Outcome 18% | Duration 12% | Date/Time 20% | Actions 8%
 * - Compact mode: Caller 40% | Outcome 22% | Date/Time 26% | Actions 12%
 */

interface HeaderProps {
  isCompact?: boolean;
}

export function CallsHeader({ isCompact = false }: HeaderProps) {
  return (
    <tr className="text-xs text-slate-500">
      <th
        className={`h-10 pl-4 text-left font-medium ${
          isCompact ? "w-[40%]" : "w-[28%]"
        }`}
      >
        Caller
      </th>
      <th
        className={`h-10 text-center font-medium ${
          isCompact ? "w-[22%]" : "w-[18%]"
        }`}
      >
        Outcome
      </th>
      <th
        className={`h-10 ${isCompact ? "text-right" : "text-center"} font-medium ${isCompact ? "w-[26%]" : "w-[12%]"
          }`}
      >
        {isCompact ? "Date/Time" : "Duration"}
      </th>
      {!isCompact && (
        <th className="h-10 w-[20%] text-right font-medium">Date/Time</th>
      )}
      <th
        className={`h-10 pr-4 text-right font-medium ${isCompact ? "w-[12%]" : "w-[8%]"}`}
      >
        Actions
      </th>
    </tr>
  );
}
