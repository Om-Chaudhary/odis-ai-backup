/**
 * VAPI Tool System
 *
 * Tool registration, execution, and built-in handlers.
 *
 * @module vapi/webhooks/tools
 */

// Re-export registry functions
export {
  clearRegistry,
  getAllTools,
  getRegisteredToolNames,
  getTool,
  hasTool,
  registerTool,
  type ToolDefinition,
  unregisterTool,
} from "./registry";

// Re-export executor functions
export {
  executeTool,
  executeToolsBatch,
  type ToolExecutionContext,
} from "./executor";

// Re-export built-in tools
export { registerBuiltInTools } from "./built-in";
