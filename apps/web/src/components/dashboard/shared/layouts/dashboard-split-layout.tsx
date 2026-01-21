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
      className={cn("h-full w-full overflow-hidden", className)}
    >
      {/* Left Panel - Table flush to edges */}
      <Panel
        defaultSize={100}
        minSize={leftPanelMinSize}
        className="min-w-0 overflow-hidden"
      >
        <div
          className={cn(
            "flex h-full min-h-0 flex-col overflow-hidden",
            "bg-card",
          )}
        >
          {leftPanel}
        </div>
      </Panel>

      {/* Resize Handle - subtle divider */}
      <PanelResizeHandle
        className={cn(
          "group bg-border/50 hover:bg-primary/30 relative w-px cursor-col-resize transition-all duration-200",
          !showRightPanel && "hidden",
        )}
      />

      {/* Right Panel - Detail flush to edges */}
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
            "bg-card",
            "border-border/50 border-l",
          )}
        >
          {/* Close Button */}
          <button
            onClick={onCloseRightPanel}
            className={cn(
              "absolute top-4 right-4 z-10",
              "flex h-8 w-8 items-center justify-center rounded-lg",
              "bg-muted text-muted-foreground transition-all duration-200",
              "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
              "focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none",
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
