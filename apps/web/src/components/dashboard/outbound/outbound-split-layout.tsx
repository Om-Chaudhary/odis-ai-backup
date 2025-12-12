"use client";

import { type ReactNode, useCallback, useRef, useEffect } from "react";
import { X } from "lucide-react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from "react-resizable-panels";
import { Button } from "@odis-ai/ui/button";
import { cn } from "@odis-ai/utils";

interface OutboundSplitLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  showRightPanel: boolean;
  onCloseRightPanel: () => void;
}

/**
 * Split Layout Component
 *
 * Resizable split-view using react-resizable-panels:
 * - Left panel: Full width by default, 60% when detail panel is open
 * - Draggable divider: Only visible when right panel is open
 * - Right panel: Hidden by default, slides in when case is selected (40%)
 */
export function OutboundSplitLayout({
  leftPanel,
  rightPanel,
  showRightPanel,
  onCloseRightPanel,
}: OutboundSplitLayoutProps) {
  const rightPanelRef = useRef<ImperativePanelHandle>(null);

  // Expand/collapse panel based on showRightPanel prop
  useEffect(() => {
    if (showRightPanel) {
      // Open to 60% width
      rightPanelRef.current?.resize(60);
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
      className="h-full overflow-hidden rounded-lg border"
    >
      {/* Left Panel - Case Table (full width when no selection) */}
      <Panel defaultSize={100} minSize={40} className="overflow-auto">
        {leftPanel}
      </Panel>

      {/* Resize Handle - Only visible when right panel is shown */}
      <PanelResizeHandle
        className={cn(
          "bg-border hover:bg-primary/20 relative w-1.5 transition-colors",
          !showRightPanel && "hidden",
        )}
      >
        <div className="bg-border absolute inset-y-0 left-1/2 w-px -translate-x-1/2" />
      </PanelResizeHandle>

      {/* Right Panel - Case Detail (hidden by default, opens to 60%) */}
      <Panel
        ref={rightPanelRef}
        defaultSize={0}
        minSize={30}
        maxSize={75}
        collapsible
        collapsedSize={0}
        onCollapse={handlePanelCollapse}
        className={cn("overflow-auto border-l", !showRightPanel && "hidden")}
      >
        <div className="relative h-full">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 h-8 w-8"
            onClick={onCloseRightPanel}
            aria-label="Close detail panel"
          >
            <X className="h-4 w-4" />
          </Button>
          {rightPanel}
        </div>
      </Panel>
    </PanelGroup>
  );
}
