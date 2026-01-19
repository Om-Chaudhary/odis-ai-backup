"use client";

import { type ReactNode, useCallback, useRef, useEffect } from "react";
import { X } from "lucide-react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
import { cn } from "@odis-ai/shared/util";

/**
 * Position data for selected row (used for tab-style connection)
 */
export interface SelectedRowPosition {
  top: number;
  height: number;
}

/**
 * Props for the unified split layout component
 */
interface DashboardSplitLayoutProps {
  /** Content for the left (table) panel */
  leftPanel: ReactNode;
  /** Content for the right (detail) panel */
  rightPanel: ReactNode;
  /** Whether the right panel is visible */
  showRightPanel: boolean;
  /** Callback when right panel is closed */
  onCloseRightPanel: () => void;
  /** Position of selected row for visual connection (optional) */
  selectedRowPosition?: SelectedRowPosition | null;
  /** Minimum size of left panel (default: 40) */
  leftPanelMinSize?: number;
  /** Default size of right panel when open (default: 55) */
  rightPanelDefaultSize?: number;
  /** Additional className for the container */
  className?: string;
}

/**
 * Dashboard Split Layout - Glassmorphism Theme
 *
 * Unified resizable split-view for both inbound and outbound dashboards:
 * - Left: Table (full width when no selection, ~45% with detail)
 * - Right: Detail panel (~55% when open, collapses to 0)
 *
 * Features:
 * - Keyboard accessible (Escape to close)
 * - Glassmorphism styling with backdrop blur
 * - Smooth resize transitions
 * - Close button in right panel
 */
export function DashboardSplitLayout({
  leftPanel,
  rightPanel,
  showRightPanel,
  onCloseRightPanel,
  leftPanelMinSize = 40,
  rightPanelDefaultSize = 55,
  className,
}: DashboardSplitLayoutProps) {
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelContainerRef = useRef<HTMLDivElement>(null);

  // Resize panel when visibility changes
  useEffect(() => {
    if (showRightPanel) {
      rightPanelRef.current?.resize(rightPanelDefaultSize);
    } else {
      rightPanelRef.current?.collapse();
    }
  }, [showRightPanel, rightPanelDefaultSize]);

  // Handle panel collapse event
  const handlePanelCollapse = useCallback(() => {
    onCloseRightPanel();
  }, [onCloseRightPanel]);

  return (
    <PanelGroup
      direction="horizontal"
      className={cn(
        "h-full w-full overflow-hidden",
        // Reduce horizontal padding when detail panel open
        showRightPanel ? "gap-0" : "gap-4",
        className,
      )}
    >
      {/* Left Panel - Table */}
      <Panel
        defaultSize={100}
        minSize={leftPanelMinSize}
        className="min-w-0 overflow-hidden"
      >
        <div
          className={cn(
            "flex h-full min-h-0 flex-col overflow-hidden",
            "bg-gradient-to-br from-white/90 via-teal-50/20 to-white/90",
            "backdrop-blur-xl",
          )}
        >
          {leftPanel}
        </div>
      </Panel>

      {/* Resize Handle - invisible bridge between table and panel */}
      <PanelResizeHandle
        className={cn(
          "group relative w-0 cursor-col-resize transition-all duration-200",
          !showRightPanel && "hidden",
        )}
      />

      {/* Right Panel - Detail with glassmorphism styling */}
      <Panel
        ref={rightPanelRef}
        defaultSize={0}
        minSize={30}
        maxSize={60}
        collapsible
        collapsedSize={0}
        onCollapse={handlePanelCollapse}
        className={cn("min-w-0 overflow-hidden", !showRightPanel && "hidden")}
      >
        <div
          ref={rightPanelContainerRef}
          className={cn(
            "relative flex h-full flex-col",
            // Subtle teal radial gradient that matches selected row
            "bg-gradient-to-r from-teal-50/80 to-teal-50/50",
            "rounded-r-xl",
            "shadow-xl shadow-teal-500/10 backdrop-blur-xl",
            "ring-1 ring-teal-200/30 ring-inset",
          )}
        >
          {/* Close Button */}
          <button
            onClick={onCloseRightPanel}
            className={cn(
              "absolute top-4 right-4 z-10",
              "flex h-8 w-8 items-center justify-center rounded-lg",
              "bg-white/70 text-slate-400 backdrop-blur-sm transition-all duration-200",
              "hover:bg-white/90 hover:text-slate-600 hover:shadow-md",
              "focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:outline-none",
            )}
            aria-label="Close detail panel"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto">{rightPanel}</div>
        </div>
      </Panel>
    </PanelGroup>
  );
}
