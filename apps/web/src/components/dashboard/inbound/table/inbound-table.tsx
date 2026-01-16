"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@odis-ai/shared/util";
import type { Database } from "@odis-ai/shared/types";
import { DataTableEmptyState } from "../../shared/data-table/data-table-empty-state";
import { Phone } from "lucide-react";
import { Checkbox } from "@odis-ai/shared/ui/checkbox";
import { CallsHeader } from "./table-headers";
import { CallRow } from "./rows/call-row";
import { TableSkeleton } from "./table-states";
import { getCallModifications } from "../demo-data";
import type { SelectedRowPosition } from "../../shared/layouts";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface InboundTableProps {
  items: InboundCall[];
  selectedItemId: string | null;
  onSelectItem: (item: InboundCall) => void;
  onToggleItem?: (item: InboundCall) => void;
  onKeyNavigation: (direction: "up" | "down") => void;
  isLoading: boolean;
  // Compact mode (when detail sidebar is open)
  isCompact?: boolean;
  // Callback for selected row position (for tab connection effect)
  onSelectedRowPositionChange?: (position: SelectedRowPosition | null) => void;
  // Bulk selection
  selectedForBulk?: Set<string>;
  onToggleBulkSelect?: (callId: string) => void;
  onSelectAll?: () => void;
}

/**
 * Inbound Table Component
 *
 * Unified table for all inbound calls with columns:
 * Caller | Outcome | Duration | Date/Time
 */
export function InboundTable({
  items,
  selectedItemId,
  onSelectItem,
  onToggleItem,
  onKeyNavigation,
  isLoading,
  isCompact = false,
  onSelectedRowPositionChange,
  selectedForBulk = new Set(),
  onToggleBulkSelect,
  onSelectAll,
}: InboundTableProps) {
  const showCheckboxes = !isCompact && !!onToggleBulkSelect;
  const tableRef = useRef<HTMLDivElement>(null);
  const selectedRowRef = useRef<HTMLTableRowElement>(null);

  // Update selected row position for tab connection effect
  const updateRowPosition = useCallback(() => {
    if (
      selectedRowRef.current &&
      tableRef.current &&
      onSelectedRowPositionChange
    ) {
      const tableRect = tableRef.current.getBoundingClientRect();
      const rowRect = selectedRowRef.current.getBoundingClientRect();
      onSelectedRowPositionChange({
        top: rowRect.top - tableRect.top + tableRef.current.scrollTop,
        height: rowRect.height,
      });
    } else if (onSelectedRowPositionChange && !selectedItemId) {
      onSelectedRowPositionChange(null);
    }
  }, [onSelectedRowPositionChange, selectedItemId]);

  // Global keyboard handler for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          onKeyNavigation("up");
          break;
        case "ArrowDown":
          e.preventDefault();
          onKeyNavigation("down");
          break;
        case "Enter":
          if (!selectedItemId && items.length > 0) {
            e.preventDefault();
            onSelectItem(items[0]!);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onKeyNavigation, selectedItemId, items, onSelectItem]);

  // Scroll selected row into view and update position
  useEffect(() => {
    if (selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
    // Small delay to let scroll finish before measuring
    const timer = setTimeout(updateRowPosition, 100);
    return () => clearTimeout(timer);
  }, [selectedItemId, updateRowPosition]);

  // Handle row click with toggle support
  const handleRowClick = useCallback(
    (item: InboundCall) => {
      if (selectedItemId === item.id && onToggleItem) {
        onToggleItem(item);
      } else {
        onSelectItem(item);
      }
    },
    [selectedItemId, onSelectItem, onToggleItem],
  );

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (items.length === 0) {
    return (
      <DataTableEmptyState
        title="No calls yet"
        description="Inbound calls will appear here when customers call in."
        icon={Phone}
      />
    );
  }

  return (
    <div
      id="inbound-table"
      ref={tableRef}
      className="h-full min-h-0 w-full overflow-auto"
    >
      <table className="w-full min-w-0 table-fixed">
        <thead
          id="inbound-table-header"
          className="sticky top-0 z-10 border-b border-teal-100/20 bg-gradient-to-r from-teal-50/40 via-teal-50/30 to-white/60 backdrop-blur-xl"
        >
          <CallsHeader
            isCompact={isCompact}
            showCheckboxes={showCheckboxes}
            allSelected={
              items.length > 0 && selectedForBulk.size === items.length
            }
            onSelectAll={onSelectAll}
          />
        </thead>
        <tbody className="divide-y divide-teal-100/10">
          {items
            .filter((item) => {
              // Apply call filtering for hardcoded modifications
              const callMods = getCallModifications(item);
              return !callMods.shouldHide;
            })
            .map((item, index) => {
              const isSelected = selectedItemId === item.id;
              return (
                <tr
                  key={item.id}
                  data-row-index={index}
                  ref={isSelected ? selectedRowRef : null}
                  className={cn(
                    "group cursor-pointer transition-all duration-150",
                    // Selected row: gradient starts white, builds to teal on right, matches panel
                    isSelected
                      ? "relative z-20 rounded-r-none border-l-2 border-l-teal-400/50 bg-gradient-to-r from-white/30 via-teal-50/55 to-teal-50/80 shadow-sm shadow-teal-500/10 backdrop-blur-sm"
                      : "transition-all duration-200 hover:bg-teal-50/30 hover:backdrop-blur-sm",
                    // Highlight for bulk selection
                    selectedForBulk.has(item.id) &&
                      !isSelected &&
                      "bg-teal-50/40",
                  )}
                  onClick={() => handleRowClick(item)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleRowClick(item);
                    }
                  }}
                >
                  {/* Checkbox cell */}
                  {showCheckboxes && (
                    <td className="py-2 pl-4">
                      <Checkbox
                        checked={selectedForBulk.has(item.id)}
                        onCheckedChange={() => onToggleBulkSelect?.(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select call from ${item.customer_phone ?? "unknown"}`}
                        className="h-4 w-4"
                      />
                    </td>
                  )}
                  <CallRow
                    call={item}
                    isCompact={isCompact}
                    onViewTranscript={() => onSelectItem(item)}
                    showCheckboxes={showCheckboxes}
                  />
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
