// Workflow components
export { WorkflowCanvas, WorkflowCanvasPreview } from "./workflow-canvas";
export { WorkflowModal } from "./workflow-modal";

// Workflow builder
export {
  buildWorkflow,
  determineSidebarState,
  type CaseDataForWorkflow,
  type SidebarState,
  type WorkflowData,
} from "./workflow-builder";

// Mock data for demos
export {
  generateMockCase,
  getMockWorkflow,
  getDemoWorkflow,
  DEMO_CASES,
  type MockCaseData,
} from "./mock-data";

// Node components (for custom use)
export * from "./nodes";

// Edge components
export * from "./edges";
