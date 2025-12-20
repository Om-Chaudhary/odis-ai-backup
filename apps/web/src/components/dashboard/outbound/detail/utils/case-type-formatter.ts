/**
 * Format case type for display
 */
export function formatCaseType(caseType: string): string {
  return caseType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
