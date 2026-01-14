"use client";

import { useEffect, useRef } from "react";
import { cn } from "@odis-ai/shared/util";
import type { Database } from "@odis-ai/shared/types";
import { DataTableEmptyState } from "../../shared/data-table/data-table-empty-state";
import { Phone } from "lucide-react";
import { CallsHeader } from "./table-headers";
import { CallRow } from "./rows/call-row";
import { TableSkeleton } from "./table-states";
import { getCallModifications } from "../demo-data";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface InboundTableProps {
  items: InboundCall[];
  selectedItemId: string | null;
  onSelectItem: (item: InboundCall) => void;
  onKeyNavigation: (direction: "up" | "down") => void;
  isLoading: boolean;
  // Compact mode (when detail sidebar is open)
  isCompact?: boolean;
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
  onKeyNavigation,
  isLoading,
  isCompact = false,
}: InboundTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const selectedRowRef = useRef<HTMLTableRowElement>(null);

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

  // Scroll selected row into view
  useEffect(() => {
    if (selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedItemId]);

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
    <div ref={tableRef} className="h-full min-h-0 overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0 z-10 border-b border-teal-100/50 bg-gradient-to-r from-teal-50/40 to-white/60 backdrop-blur-sm">
          <CallsHeader isCompact={isCompact} />
        </thead>
        <tbody className="divide-y divide-teal-50">
          {items
            .filter((item) => {
              // Apply call filtering for hardcoded modifications
              const callMods = getCallModifications(item);
              return !callMods.shouldHide;
            })
            .map((item) => {
              const isSelected = selectedItemId === item.id;
              return (
                <tr
                  key={item.id}
                  ref={isSelected ? selectedRowRef : null}
                  className={cn(
                    "group cursor-pointer transition-all duration-150",
                    // Selected row: matching background + accent for visual connection to detail panel
                    isSelected
                      ? "border-l-2 border-l-teal-500 bg-teal-100/80"
                      : "hover:bg-teal-50/30",
                  )}
                  onClick={() => onSelectItem(item)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onSelectItem(item);
                    }
                  }}
                >
                  <CallRow call={item} isCompact={isCompact} />
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
