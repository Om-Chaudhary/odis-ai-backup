/**
 * Tool Registry
 *
 * Manages registration and lookup of VAPI tool handlers.
 *
 * @module vapi/webhooks/tools/registry
 */

import type { ToolHandler } from "../types";
import { loggers } from "~/lib/logger";

const logger = loggers.webhook.child("tool-registry");

/**
 * Tool definition for registration
 */
export interface ToolDefinition {
  /** Unique tool name (must match VAPI Dashboard configuration) */
  name: string;
  /** Human-readable description */
  description: string;
  /** The handler function */
  handler: ToolHandler;
}

/**
 * Internal registry of tool handlers
 */
const toolRegistry = new Map<string, ToolDefinition>();

/**
 * Register a tool handler
 *
 * @param definition - Tool definition including name, description, and handler
 */
export function registerTool(definition: ToolDefinition): void {
  if (toolRegistry.has(definition.name)) {
    logger.warn("Tool already registered, overwriting", {
      toolName: definition.name,
    });
  }

  toolRegistry.set(definition.name, definition);

  logger.debug("Tool registered", {
    toolName: definition.name,
    description: definition.description,
  });
}

/**
 * Get a tool handler by name
 *
 * @param name - Tool name
 * @returns Tool definition or undefined
 */
export function getTool(name: string): ToolDefinition | undefined {
  return toolRegistry.get(name);
}

/**
 * Check if a tool is registered
 *
 * @param name - Tool name
 * @returns True if tool exists
 */
export function hasTool(name: string): boolean {
  return toolRegistry.has(name);
}

/**
 * Get all registered tool names
 *
 * @returns Array of tool names
 */
export function getRegisteredToolNames(): string[] {
  return Array.from(toolRegistry.keys());
}

/**
 * Get all registered tools
 *
 * @returns Array of tool definitions
 */
export function getAllTools(): ToolDefinition[] {
  return Array.from(toolRegistry.values());
}

/**
 * Unregister a tool
 *
 * @param name - Tool name to remove
 * @returns True if tool was removed
 */
export function unregisterTool(name: string): boolean {
  const result = toolRegistry.delete(name);
  if (result) {
    logger.debug("Tool unregistered", { toolName: name });
  }
  return result;
}

/**
 * Clear all registered tools
 * Useful for testing
 */
export function clearRegistry(): void {
  toolRegistry.clear();
  logger.debug("Tool registry cleared");
}
