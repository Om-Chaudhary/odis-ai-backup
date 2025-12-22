"use client";

import { useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

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
import {
  buildWorkflow,
  type CaseDataForWorkflow,
  type WorkflowData,
} from "./workflow-builder";

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

interface WorkflowCanvasProps {
  caseData: CaseDataForWorkflow;
  className?: string;
}

/**
 * Workflow Canvas - React Flow container for visualizing the discharge workflow.
 * Displays the case journey as an interactive node-based diagram.
 */
export function WorkflowCanvas({ caseData, className }: WorkflowCanvasProps) {
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

  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{ width: "100%", minHeight: "400px" }}
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
          padding: 0.2,
          maxZoom: 1,
        }}
        // Disable interactions for clean read-only display
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        // Attribution
        proOptions={{ hideAttribution: true }}
      >
        {/* Subtle dot pattern background */}
        <Background color="#e2e8f0" gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}

/**
 * WorkflowCanvasPreview - Simplified version for preview states
 */
export function WorkflowCanvasPreview({
  workflow,
  className,
}: {
  workflow: WorkflowData;
  className?: string;
}) {
  const [nodes, , onNodesChange] = useNodesState(workflow.nodes);
  const [edges, , onEdgesChange] = useEdgesState(workflow.edges);

  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{ width: "100%", minHeight: "400px" }}
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
          padding: 0.2,
          maxZoom: 1,
        }}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e2e8f0" gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}
