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

interface InboundSplitLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  showRightPanel: boolean;
  onCloseRightPanel: () => void;
}

/**
 * Split Layout - Glassmorphism Theme
 *
 * Resizable split-view with glassmorphism styling:
 * - Left: Table (full width when no selection, 35% with detail)
 * - Right: Detail panel (65% when open, collapses to 0)
 */
export function InboundSplitLayout({
  leftPanel,
  rightPanel,
  showRightPanel,
  onCloseRightPanel,
}: InboundSplitLayoutProps) {
  const rightPanelRef = useRef<ImperativePanelHandle>(null);

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
        "h-full px-6 py-4",
        showRightPanel ? "gap-0" : "gap-4",
      )}
    >
      {/* Left Panel - Table */}
      <Panel defaultSize={100} minSize={40} className="overflow-hidden">
        <div
          className={cn(
            "flex h-full flex-col overflow-hidden",
            "border border-teal-200/40",
            "bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70",
            "shadow-lg shadow-teal-500/5 backdrop-blur-md",
            // When right panel is open, remove right border-radius to connect
            showRightPanel
              ? "rounded-l-xl rounded-r-none border-r-0"
              : "rounded-xl",
          )}
        >
          {leftPanel}
        </div>
      </Panel>

      {/* Invisible Resize Handle - allows resizing without visible divider */}
      <PanelResizeHandle
        className={cn(
          "group relative w-1 cursor-col-resize transition-all duration-200",
          !showRightPanel && "hidden",
        )}
      />

      {/* Right Panel - Detail (connected to active row with matching teal background) */}
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
          className={cn(
            "relative flex h-full flex-col overflow-hidden",
            // Slightly darker teal background to show connection to active row
            "bg-teal-100/80",
            // Border on all sides except left (connects to table)
            "border-y border-r border-teal-200/40",
            "rounded-l-none rounded-r-xl",
            "shadow-lg shadow-teal-500/5 backdrop-blur-md",
          )}
        >
          {/* Close Button */}
          <button
            onClick={onCloseRightPanel}
            className={cn(
              "absolute top-4 right-4 z-10",
              "flex h-8 w-8 items-center justify-center rounded-lg",
              "bg-white/60 text-slate-400 backdrop-blur-sm transition-all duration-200",
              "hover:bg-white/80 hover:text-slate-600 hover:shadow-md",
            )}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex-1 overflow-auto">{rightPanel}</div>
        </div>
      </Panel>
    </PanelGroup>
  );
}
