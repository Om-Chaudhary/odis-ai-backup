"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@odis-ai/shared/ui/dialog";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Maximize2,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";

// Import custom nodes
import {
  AppointmentNode,
  TriggerNode,
  ActionNode,
  SentimentNode,
  AttentionNode,
  StatusNode,
} from "./nodes";

// Import custom edges
import { AnimatedEdge } from "./edges";

// Import workflow builder
import { buildWorkflow, type CaseDataForWorkflow } from "./workflow-builder";

// Import content components
import { CallPlayer } from "@odis-ai/shared/ui/media";

// Define node types
const nodeTypes: NodeTypes = {
  appointment: AppointmentNode,
  trigger: TriggerNode,
  action: ActionNode,
  sentiment: SentimentNode,
  attention: AttentionNode,
  status: StatusNode,
};

// Define edge types
const edgeTypes: EdgeTypes = {
  animated: AnimatedEdge,
};

// Default edge options
const defaultEdgeOptions = {
  type: "animated",
  animated: true,
};

// Content panel types
type ContentType = "transcript" | "email" | "attention" | "summary" | null;

interface ContentPanelProps {
  type: ContentType;
  caseData: CaseDataForWorkflow;
  onClose: () => void;
}

function ContentPanel({ type, caseData, onClose }: ContentPanelProps) {
  if (!type) return null;

  const getContent = () => {
    switch (type) {
      case "transcript":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-teal-700">
              <Phone className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Call Transcript</h3>
            </div>
            {caseData.scheduledCall?.recordingUrl ||
            caseData.scheduledCall?.transcript ? (
              <CallPlayer
                audioUrl={caseData.scheduledCall.recordingUrl ?? ""}
                plainTranscript={
                  caseData.scheduledCall.cleanedTranscript ??
                  caseData.scheduledCall.transcript
                }
                duration={caseData.scheduledCall.durationSeconds ?? undefined}
                title="Discharge Call"
              />
            ) : (
              <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                No transcript available for this call.
              </div>
            )}
          </div>
        );

      case "email":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-teal-700">
              <Mail className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Email Content</h3>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Email sent to:{" "}
                <span className="font-medium">{caseData.owner.email}</span>
              </p>
            </div>
          </div>
        );

      case "summary":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-teal-700">
              <FileText className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Call Summary</h3>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm whitespace-pre-wrap text-slate-700">
                {caseData.scheduledCall?.summary ?? "No summary available."}
              </p>
            </div>
          </div>
        );

      case "attention":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Attention Required</h3>
            </div>
            <div className="space-y-3">
              {caseData.attentionTypes?.map((type, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                >
                  <p className="text-sm font-medium text-amber-800">{type}</p>
                </div>
              ))}
              {caseData.attentionSummary && (
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-700">
                    {caseData.attentionSummary}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-y-0 right-0 z-10 w-[400px] overflow-auto border-l border-slate-200 bg-white shadow-lg">
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <span className="text-sm font-medium text-slate-700">Details</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4">{getContent()}</div>
    </div>
  );
}

interface WorkflowModalProps {
  caseData: CaseDataForWorkflow;
  trigger?: React.ReactNode;
}

/**
 * Interactive Workflow Modal
 * Opens as a fullscreen centered modal with clickable nodes
 */
export function WorkflowModal({ caseData, trigger }: WorkflowModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeContent, setActiveContent] = useState<ContentType>(null);

  // Build workflow from case data
  const workflow = useMemo(() => buildWorkflow(caseData), [caseData]);

  // Use React Flow state hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges);

  // Update nodes/edges when case data changes
  useEffect(() => {
    const newWorkflow = buildWorkflow(caseData);
    setNodes(newWorkflow.nodes);
    setEdges(newWorkflow.edges);
  }, [caseData, setNodes, setEdges]);

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const nodeId = node.id;
    const nodeType = node.type;
    const nodeData = node.data;

    // Determine what content to show based on node
    if (
      nodeId === "call-completed" ||
      nodeData?.actionType === "call_completed"
    ) {
      setActiveContent("transcript");
    } else if (
      nodeId === "email-sent" ||
      nodeData?.actionType === "email_sent"
    ) {
      setActiveContent("email");
    } else if (nodeType === "sentiment") {
      setActiveContent("summary");
    } else if (nodeType === "attention") {
      setActiveContent("attention");
    }
  }, []);

  // Close content panel when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveContent(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-600 hover:text-teal-700"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="text-xs">Expand</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="flex h-[85vh] w-[1200px] max-w-[90vw] flex-col overflow-hidden p-0"
        aria-describedby={undefined}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Workflow Timeline</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <FileText className="h-5 w-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Case Workflow
              </h2>
              <p className="text-sm text-slate-500">
                Click on any node to view details
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content - React Flow needs explicit dimensions */}
        <div className="relative min-h-0 flex-1">
          {/* React Flow Canvas */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-300",
              activeContent ? "right-[400px]" : "right-0",
            )}
            style={{
              width: activeContent ? "calc(100% - 400px)" : "100%",
              height: "100%",
            }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{
                padding: 0.3,
                maxZoom: 1.2,
              }}
              // Enable some interactions in fullscreen
              panOnDrag={true}
              zoomOnScroll={true}
              zoomOnPinch={true}
              zoomOnDoubleClick={false}
              preventScrolling={true}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              proOptions={{ hideAttribution: true }}
              className="cursor-pointer"
              style={{ width: "100%", height: "100%" }}
            >
              <Background color="#e2e8f0" gap={20} size={1} />
            </ReactFlow>
          </div>

          {/* Content Panel */}
          <ContentPanel
            type={activeContent}
            caseData={caseData}
            onClose={() => setActiveContent(null)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
