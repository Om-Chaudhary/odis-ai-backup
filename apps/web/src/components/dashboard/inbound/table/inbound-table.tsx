"use client";

import { useEffect, useRef } from "react";
import { cn } from "@odis-ai/utils";
import type {
  ViewMode,
  InboundItem,
  AppointmentRequest,
  ClinicMessage,
} from "../types";
import type { Database } from "~/database.types";
import { CallsHeader, AppointmentsHeader, MessagesHeader } from "./table-headers";
import { CallRow } from "./rows/call-row";
import { AppointmentRow } from "./rows/appointment-row";
import { MessageRow } from "./rows/message-row";
import { TableSkeleton, TableEmpty } from "./table-states";
import { getCallModifications } from "../demo-data";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface InboundTableProps {
  items: InboundItem[];
  viewMode: ViewMode;
  selectedItemId: string | null;
  onSelectItem: (item: InboundItem) => void;
  onKeyNavigation: (direction: "up" | "down") => void;
  isLoading: boolean;
  onQuickAction?: (id: string) => Promise<void>;
}

/**
 * Inbound Table Component
 *
 * Renders different columns based on view mode:
 * - Calls: Phone, Duration, Status, Sentiment, Time
 * - Appointments: Patient/Client, Species, Reason, Status, Date/Time
 * - Messages: Caller, Message Preview, Priority, Status, Time
 */
export function InboundTable({
  items,
  viewMode,
  selectedItemId,
  onSelectItem,
  onKeyNavigation,
  isLoading,
  onQuickAction,
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
    return <TableSkeleton viewMode={viewMode} />;
  }

  if (items.length === 0) {
    return <TableEmpty viewMode={viewMode} />;
  }

  return (
    <div ref={tableRef} className="h-full overflow-auto">
      <table className="w-full">
        <thead className="bg-muted/40 sticky top-0 z-10 border-b backdrop-blur-sm">
          {viewMode === "calls" && <CallsHeader />}
          {viewMode === "appointments" && <AppointmentsHeader />}
          {viewMode === "messages" && <MessagesHeader />}
        </thead>
        <tbody className="divide-border/50 divide-y">
          {items
            .filter((item) => {
              // Apply call filtering for hardcoded modifications
              if (viewMode === "calls") {
                const callMods = getCallModifications(item as InboundCall);
                return !callMods.shouldHide;
              }
              return true;
            })
            .map((item) => {
              const isSelected = selectedItemId === item.id;
              return (
                <tr
                  key={item.id}
                  ref={isSelected ? selectedRowRef : null}
                  className={cn(
                    "group cursor-pointer transition-all duration-150",
                    isSelected
                      ? "bg-accent border-l-2 border-l-teal-500"
                      : "hover:bg-muted/50",
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
                  {viewMode === "calls" && (
                    <CallRow call={item as InboundCall} />
                  )}
                  {viewMode === "appointments" && (
                    <AppointmentRow
                      appointment={item as AppointmentRequest}
                      onQuickAction={onQuickAction}
                    />
                  )}
                  {viewMode === "messages" && (
                    <MessageRow
                      message={item as ClinicMessage}
                      onQuickAction={onQuickAction}
                    />
                  )}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
