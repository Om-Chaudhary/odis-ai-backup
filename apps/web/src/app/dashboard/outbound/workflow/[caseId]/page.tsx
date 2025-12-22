"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import { ArrowLeft, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@odis-ai/utils";
import { api } from "~/trpc/client";

// Import custom nodes
import {
  AppointmentNode,
  TriggerNode,
  ActionNode,
  SentimentNode,
  AttentionNode,
  StatusNode,
} from "~/components/dashboard/outbound/detail/workflow/nodes";

// Import custom edges
import { AnimatedEdge } from "~/components/dashboard/outbound/detail/workflow/edges";

// Import workflow builder
import {
  buildWorkflow,
  type CaseDataForWorkflow,
} from "~/components/dashboard/outbound/detail/workflow/workflow-builder";

// Node types registry
const nodeTypes: NodeTypes = {
  appointment: AppointmentNode,
  trigger: TriggerNode,
  action: ActionNode,
  sentiment: SentimentNode,
  attention: AttentionNode,
  status: StatusNode,
};

// Edge types registry
const edgeTypes: EdgeTypes = {
  animated: AnimatedEdge,
};

// Default edge options
const defaultEdgeOptions = {
  type: "animated",
  animated: true,
};

export default function WorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  // Fetch case data
  const { data: caseData, isLoading } = api.outbound.getCaseById.useQuery(
    { id: caseId },
    { enabled: Boolean(caseId) },
  );

  // Transform case data for workflow
  const workflowCaseData: CaseDataForWorkflow | null = useMemo(() => {
    if (!caseData) return null;
    return {
      id: caseData.caseId,
      caseId: caseData.caseId,
      status: caseData.status,
      caseType: caseData.caseType ?? null,
      timestamp: caseData.timestamp,
      emailSent: caseData.emailSent,
      scheduledEmailFor: null,
      phoneSent: caseData.phoneSent,
      scheduledCallFor: caseData.scheduledTime ?? null,
      scheduledCall: caseData.scheduledCall ?? null,
      needsAttention: caseData.needsAttention ?? false,
      attentionTypes: caseData.attentionTypes ?? [],
      attentionSeverity: caseData.attentionSeverity ?? null,
      attentionSummary: caseData.attentionSummary ?? null,
      owner: {
        email: caseData.patient.email ?? null,
        phone: caseData.patient.phone ?? null,
      },
    };
  }, [caseData]);

  // Build workflow from case data
  const workflow = useMemo(() => {
    if (!workflowCaseData) return { nodes: [], edges: [] };
    return buildWorkflow(workflowCaseData);
  }, [workflowCaseData]);

  // Use React Flow state hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges);

  // Update nodes/edges when case data changes
  useEffect(() => {
    if (workflowCaseData) {
      const newWorkflow = buildWorkflow(workflowCaseData);
      setNodes(newWorkflow.nodes);
      setEdges(newWorkflow.edges);
    }
  }, [workflowCaseData, setNodes, setEdges]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="text-slate-600">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-orange-500" />
          <h2 className="mb-2 text-xl font-semibold text-slate-800">
            Case Not Found
          </h2>
          <p className="mb-4 text-slate-600">
            The requested case could not be found.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <FileText className="h-5 w-5 text-teal-700" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Workflow: {caseData.patient.name}
              </h1>
              <p className="text-sm text-slate-500">
                {caseData.patient.ownerName} • Interactive workflow view
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={caseData.status === "completed" ? "default" : "secondary"}
            className={cn(
              caseData.status === "completed" && "bg-green-100 text-green-700",
              caseData.status === "failed" && "bg-red-100 text-red-700",
              caseData.status === "pending_review" &&
                "bg-yellow-100 text-yellow-700",
            )}
          >
            {String(caseData.status).replace(/_/g, " ")}
          </Badge>
        </div>
      </header>

      {/* Main Content - React Flow Canvas */}
      <div className="relative min-h-0 flex-1">
        <div
          className="absolute inset-0"
          style={{ width: "100%", height: "100%" }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            fitViewOptions={{
              padding: 0.3,
              maxZoom: 1.2,
            }}
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
            <Controls className="rounded-lg bg-white shadow-lg" />
            <MiniMap
              className="rounded-lg bg-white shadow-lg"
              nodeColor={(node) => {
                switch (node.type) {
                  case "appointment":
                    return "#14b8a6";
                  case "action":
                    return "#3b82f6";
                  case "attention":
                    return "#f97316";
                  case "sentiment":
                    return "#8b5cf6";
                  default:
                    return "#94a3b8";
                }
              }}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
