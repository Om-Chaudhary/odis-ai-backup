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

// Shared selected row position type
export interface SelectedRowPosition {
  top: number;
  height: number;
}

interface OutboundSplitLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  showRightPanel: boolean;
  onCloseRightPanel: () => void;
  selectedRowPosition?: SelectedRowPosition | null;
}

/**
 * Split Layout - Glassmorphism Theme
 *
 * Resizable split-view with glassmorphism styling:
 * - Left: Table (full width when no selection, 30% with detail)
 * - Right: Detail panel (70% when open, collapses to 0)
 */
export function OutboundSplitLayout({
  leftPanel,
  rightPanel,
  showRightPanel,
  onCloseRightPanel,
}: OutboundSplitLayoutProps) {
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showRightPanel) {
      rightPanelRef.current?.resize(55);
    } else {
      rightPanelRef.current?.collapse();
    }
  }, [showRightPanel]);

  const handlePanelCollapse = useCallback(() => {
    onCloseRightPanel();
  }, [onCloseRightPanel]);

  return (
    <PanelGroup
      direction="horizontal"
      className={cn(
        "h-full w-full overflow-hidden",
        // reduce horizontal padding when detail panel open
        showRightPanel ? "gap-0" : "gap-4",
      )}
    >
      {/* Left Panel - Table */}
      <Panel defaultSize={100} minSize={40} className="min-w-0 overflow-hidden">
        <div
          className={cn(
            "flex h-full flex-col",
            "bg-gradient-to-br from-white/90 via-teal-50/20 to-white/90",
            "backdrop-blur-xl",
            // When right panel is open, allow overflow for seamless connection
            showRightPanel ? "overflow-visible" : "overflow-hidden",
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

      {/* Right Panel - Detail with tab-style connection to selected row */}
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
            // Subtle teal radial gradient that matches selected row - fades from left to middle toright (teal on left and right, white in middle)
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
            )}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto">{rightPanel}</div>
        </div>
      </Panel>
    </PanelGroup>
  );
}
