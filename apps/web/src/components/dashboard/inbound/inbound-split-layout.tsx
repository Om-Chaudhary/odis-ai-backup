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
      rightPanelRef.current?.resize(65);
    } else {
      rightPanelRef.current?.collapse();
    }
  }, [showRightPanel]);

  const handlePanelCollapse = useCallback(() => {
    onCloseRightPanel();
  }, [onCloseRightPanel]);

  return (
    <PanelGroup direction="horizontal" className="h-full gap-3">
      {/* Left Panel - Table */}
      <Panel defaultSize={100} minSize={30} className="overflow-hidden">
        <div
          className={cn(
            "flex h-full flex-col overflow-hidden",
            "rounded-xl border border-teal-200/40",
            "bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70",
            "shadow-lg shadow-teal-500/5 backdrop-blur-md",
          )}
        >
          {leftPanel}
        </div>
      </Panel>

      {/* Resize Handle */}
      <PanelResizeHandle
        className={cn(
          "group relative w-2 transition-all duration-200",
          !showRightPanel && "hidden",
        )}
      >
        <div
          className={cn(
            "absolute inset-y-4 left-1/2 w-1 -translate-x-1/2 rounded-full",
            "bg-teal-200/50 transition-all duration-200",
            "group-hover:bg-teal-400/60 group-hover:shadow-sm",
            "group-active:bg-teal-500/70",
          )}
        />
      </PanelResizeHandle>

      {/* Right Panel - Detail */}
      <Panel
        ref={rightPanelRef}
        defaultSize={0}
        minSize={25}
        maxSize={75}
        collapsible
        collapsedSize={0}
        onCollapse={handlePanelCollapse}
        className={cn("min-w-0 overflow-hidden", !showRightPanel && "hidden")}
      >
        <div
          className={cn(
            "relative flex h-full flex-col overflow-hidden",
            "rounded-xl border border-teal-200/40",
            "bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70",
            "shadow-lg shadow-teal-500/5 backdrop-blur-md",
          )}
        >
          {/* Close Button */}
          <button
            onClick={onCloseRightPanel}
            className={cn(
              "absolute top-3 right-3 z-10",
              "flex h-7 w-7 items-center justify-center rounded-lg",
              "text-slate-400 transition-all duration-200",
              "hover:bg-slate-100 hover:text-slate-600",
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
