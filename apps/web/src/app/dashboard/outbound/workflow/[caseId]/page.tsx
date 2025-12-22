"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@odis-ai/ui/button";
import { Badge } from "@odis-ai/ui/badge";
import {
  ArrowLeft,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  X,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import { cn } from "@odis-ai/utils";
import { api } from "~/trpc/react";

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

// Content panel types
type ContentType = "call" | "email" | "transcript" | "attention" | null;

interface ContentPanelProps {
  type: ContentType;
  caseData: CaseDataForWorkflow | null;
  onClose: () => void;
}

function ContentPanel({ type, caseData, onClose }: ContentPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!type || !caseData) return null;

  return (
    <div className="animate-in slide-in-from-right absolute top-0 right-0 bottom-0 z-10 flex w-[450px] flex-col border-l border-slate-200 bg-white shadow-xl duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          {type === "call" && <Phone className="h-4 w-4 text-teal-600" />}
          {type === "email" && <Mail className="h-4 w-4 text-blue-600" />}
          {type === "transcript" && (
            <FileText className="h-4 w-4 text-purple-600" />
          )}
          {type === "attention" && (
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          )}
          <span className="font-semibold text-slate-800">
            {type === "call" && "Call Recording"}
            {type === "email" && "Email Preview"}
            {type === "transcript" && "Call Transcript"}
            {type === "attention" && "Attention Required"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {type === "call" && (
          <div className="space-y-4">
            {/* Audio Player */}
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 rounded-full p-0"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4" />
                  )}
                </Button>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-1/3 rounded-full bg-teal-500" />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>1:23</span>
                    <span>4:15</span>
                  </div>
                </div>
                <Volume2 className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                Call with {caseData.patient?.ownerName ?? "Owner"} regarding{" "}
                {caseData.patient?.name ?? "patient"}&apos;s discharge
                instructions.
              </p>
            </div>

            {/* Call Details */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">
                Call Details
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-500">Duration:</div>
                <div className="text-slate-800">4:15</div>
                <div className="text-slate-500">Status:</div>
                <div>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-700"
                  >
                    Completed
                  </Badge>
                </div>
                <div className="text-slate-500">Phone:</div>
                <div className="text-slate-800">
                  {caseData.patient?.phone ?? "N/A"}
                </div>
              </div>
            </div>
          </div>
        )}

        {type === "transcript" && (
          <div className="space-y-4">
            <div className="space-y-3 rounded-lg bg-slate-50 p-4">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-medium text-teal-700">
                  AI
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-800">
                    Hello, this is ODIS calling on behalf of the veterinary
                    clinic regarding {caseData.patient?.name ?? "your pet"}
                    &apos;s recent visit. Do you have a moment to go over the
                    discharge instructions?
                  </p>
                  <span className="text-xs text-slate-400">0:00</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                  {(caseData.patient?.ownerName ?? "O")[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-800">
                    Yes, I have a few minutes. What do I need to know?
                  </p>
                  <span className="text-xs text-slate-400">0:15</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-medium text-teal-700">
                  AI
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-800">
                    Great! The doctor wanted me to remind you about the
                    medication schedule and follow-up appointment...
                  </p>
                  <span className="text-xs text-slate-400">0:22</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {type === "email" && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-sm">
                  <span className="text-slate-500">To: </span>
                  <span className="text-slate-800">
                    {caseData.patient?.email ?? "owner@email.com"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500">Subject: </span>
                  <span className="text-slate-800">
                    Discharge Instructions for{" "}
                    {caseData.patient?.name ?? "Your Pet"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm leading-relaxed text-slate-700">
                  Dear {caseData.patient?.ownerName ?? "Pet Owner"},
                  <br />
                  <br />
                  Thank you for visiting our clinic today. Below are the
                  discharge instructions for{" "}
                  {caseData.patient?.name ?? "your pet"}&apos;s care:
                  <br />
                  <br />
                  <strong>Medications:</strong>
                  <br />
                  Please administer medications as prescribed by the
                  veterinarian.
                  <br />
                  <br />
                  <strong>Follow-up:</strong>
                  <br />
                  A follow-up appointment may be needed. Please contact us if
                  you notice any concerning symptoms.
                  <br />
                  <br />
                  Best regards,
                  <br />
                  Your Veterinary Team
                </p>
              </div>
            </div>
          </div>
        )}

        {type === "attention" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-600" />
                <div>
                  <h4 className="font-medium text-orange-800">
                    This case requires attention
                  </h4>
                  <p className="mt-1 text-sm text-orange-700">
                    {caseData.attentionSummary ??
                      "Please review this case and take appropriate action."}
                  </p>
                </div>
              </div>
            </div>
            {caseData.attentionTypes && caseData.attentionTypes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700">
                  Attention Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {caseData.attentionTypes.map((type) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className="text-orange-700"
                    >
                      {type.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const [activeContent, setActiveContent] = useState<ContentType>(null);

  // Fetch case data
  const { data: caseData, isLoading } =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    api.outbound.getDischargeCaseById.useQuery(
      { id: caseId },
      { enabled: Boolean(caseId) },
    );

  // Transform case data for workflow
  const workflowCaseData: CaseDataForWorkflow | null = useMemo(() => {
    if (!caseData) return null;
    return {
      status: caseData.status,
      phoneSent: caseData.phoneSent,
      emailSent: caseData.emailSent,
      scheduledTime: caseData.scheduledTime,
      sentimentScore: caseData.sentimentScore,
      needsAttention: caseData.needsAttention,
      attentionTypes: caseData.attentionTypes,
      attentionSeverity: caseData.attentionSeverity,
      attentionSummary: caseData.attentionSummary,
      appointment: caseData.appointment,
      patient: {
        name: caseData.patient.name,
        ownerName: caseData.patient.ownerName,
        phone: caseData.patient.phone,
        email: caseData.patient.email,
      },
      callTranscript: caseData.callTranscript,
      callSummary: caseData.callSummary,
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

  // Handle node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nodeType = node.type;
      const nodeData = node.data;

      // Determine what content to show based on node type
      if (nodeType === "action") {
        const actionType = nodeData.actionType as string;
        if (actionType === "call" || actionType === "call-preview") {
          // Check if call was completed
          if (workflowCaseData?.phoneSent === "completed") {
            setActiveContent("transcript");
          } else {
            setActiveContent("call");
          }
        } else if (actionType === "email" || actionType === "email-preview") {
          setActiveContent("email");
        }
      } else if (nodeType === "attention") {
        setActiveContent("attention");
      } else if (nodeType === "sentiment") {
        setActiveContent("transcript");
      }
    },
    [workflowCaseData],
  );

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
                {caseData.patient.ownerName} • Click on nodes to view details
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

      {/* Main Content */}
      <div className="relative min-h-0 flex-1">
        {/* React Flow Canvas */}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-300",
            activeContent ? "right-[450px]" : "right-0",
          )}
          style={{
            width: activeContent ? "calc(100% - 450px)" : "100%",
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

        {/* Content Panel */}
        <ContentPanel
          type={activeContent}
          caseData={workflowCaseData}
          onClose={() => setActiveContent(null)}
        />
      </div>
    </div>
  );
}
