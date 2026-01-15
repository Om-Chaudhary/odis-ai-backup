import { Checkbox } from "@odis-ai/shared/ui/checkbox";

/**
 * Table header component for inbound calls
 *
 * Column widths:
 * - Full mode: [Checkbox 4%] Caller 26% | Outcome 16% | Duration 12% | Date/Time 20% | Actions 8%
 * - Compact mode: Caller 40% | Outcome 22% | Date/Time 26% | Actions 12%
 */

interface HeaderProps {
  isCompact?: boolean;
  showCheckboxes?: boolean;
  allSelected?: boolean;
  onSelectAll?: () => void;
}

export function CallsHeader({
  isCompact = false,
  showCheckboxes = false,
  allSelected = false,
  onSelectAll,
}: HeaderProps) {
  return (
    <tr className="text-xs text-slate-500">
      {showCheckboxes && (
        <th className="h-10 w-[4%] pl-4 text-left">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            aria-label="Select all calls"
            className="h-4 w-4"
          />
        </th>
      )}
      <th
        className={`h-10 ${showCheckboxes ? "" : "pl-4"} text-left font-medium ${
          isCompact ? "w-[40%]" : showCheckboxes ? "w-[24%]" : "w-[28%]"
        }`}
      >
        Caller
      </th>
      <th
        className={`h-10 text-center font-medium ${
          isCompact ? "w-[22%]" : showCheckboxes ? "w-[16%]" : "w-[18%]"
        }`}
      >
        Outcome
      </th>
      <th
        className={`h-10 ${isCompact ? "text-right" : "text-center"} font-medium ${
          isCompact ? "w-[26%]" : "w-[12%]"
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
        <span className="sr-only">Actions</span>
      </th>
    </tr>
  );
}
