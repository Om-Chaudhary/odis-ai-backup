/**
 * Workflow Builder
 *
 * Generates React Flow nodes and edges from case data.
 * Determines the sidebar state and builds appropriate workflow visualization.
 */

import { type Node, type Edge } from "@xyflow/react";

// Types for case data
export interface CaseDataForWorkflow {
  id: string;
  caseId: string;
  status: string;
  caseType: string | null;
  timestamp: string;
  // Email
  emailSent: "sent" | "pending" | "failed" | "not_applicable" | null;
  scheduledEmailFor: string | null;
  // Call
  phoneSent: "sent" | "pending" | "failed" | "not_applicable" | null;
  scheduledCallFor: string | null;
  scheduledCall: {
    id: string;
    durationSeconds: number | null;
    transcript: string | null;
    cleanedTranscript?: string | null;
    recordingUrl: string | null;
    summary: string | null;
    endedReason: string | null;
  } | null;
  // Attention
  needsAttention?: boolean;
  attentionTypes?: string[] | null;
  attentionSeverity?: string | null;
  attentionSummary?: string | null;
  // Owner
  owner: {
    email: string | null;
    phone: string | null;
  };
}

export type SidebarState =
  | "pending_review" // Neither sent
  | "email_only" // Only email sent
  | "call_only" // Only call sent
  | "both_sent" // Both sent successfully
  | "with_attention" // Has attention alerts
  | "failed"; // Failed state

export interface WorkflowData {
  nodes: Node[];
  edges: Edge[];
  state: SidebarState;
}

// Node positioning constants
const NODE_WIDTH = 220;
const NODE_HEIGHT_SMALL = 80;
const NODE_HEIGHT_LARGE = 120;
const VERTICAL_GAP = 60;
const HORIZONTAL_GAP = 40;

/**
 * Determine the sidebar state from case data
 */
export function determineSidebarState(
  caseData: CaseDataForWorkflow,
): SidebarState {
  const emailSent = caseData.emailSent === "sent";
  const callSent = caseData.phoneSent === "sent";
  const emailFailed = caseData.emailSent === "failed";
  const callFailed = caseData.phoneSent === "failed";

  // Check for attention alerts first
  if (caseData.needsAttention && caseData.attentionTypes?.length) {
    return "with_attention";
  }

  // Check for failures
  if (emailFailed || callFailed) {
    return "failed";
  }

  // Check completion states
  if (emailSent && callSent) {
    return "both_sent";
  }

  if (emailSent && !callSent) {
    return "email_only";
  }

  if (callSent && !emailSent) {
    return "call_only";
  }

  // Default: pending review
  return "pending_review";
}

/**
 * Format duration in seconds to "Xm Ys" format
 */
function formatDuration(seconds: number | null): string {
  if (seconds === null) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Format timestamp to relative time (e.g., "2h ago")
 */
function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return "";

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch {
    return "";
  }
}

/**
 * Infer customer sentiment from call data
 */
function inferSentiment(
  caseData: CaseDataForWorkflow,
): "positive" | "neutral" | "negative" {
  // Check if there are attention alerts - likely negative
  if (caseData.needsAttention) {
    const severity = caseData.attentionSeverity;
    if (severity === "critical") return "negative";
    if (severity === "urgent") return "neutral";
  }

  // Check call summary for sentiment indicators
  const summary = caseData.scheduledCall?.summary?.toLowerCase() ?? "";
  const transcript = caseData.scheduledCall?.transcript?.toLowerCase() ?? "";

  if (
    summary.includes("concern") ||
    summary.includes("worried") ||
    summary.includes("upset") ||
    transcript.includes("not happy")
  ) {
    return "negative";
  }

  if (
    summary.includes("happy") ||
    summary.includes("satisfied") ||
    summary.includes("thank") ||
    transcript.includes("thank you")
  ) {
    return "positive";
  }

  return "neutral";
}

/**
 * Build workflow for pending review state (neither sent)
 */
function buildPendingReviewWorkflow(
  caseData: CaseDataForWorkflow,
): WorkflowData {
  const centerX = NODE_WIDTH / 2 + 20;
  let currentY = 0;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Appointment ended node
  nodes.push({
    id: "appointment",
    type: "appointment",
    position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    data: {
      caseType: caseData.caseType ?? "Visit",
      timestamp: formatRelativeTime(caseData.timestamp),
    },
  });

  currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

  // Awaiting approval node
  nodes.push({
    id: "awaiting",
    type: "trigger",
    position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    data: {
      triggerType: "awaiting_approval",
      status: "pending",
    },
  });

  edges.push({
    id: "appointment-awaiting",
    source: "appointment",
    target: "awaiting",
    type: "animated",
    data: { status: "completed" },
  });

  currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

  // Preview nodes (email and call side by side)
  const hasEmail = Boolean(caseData.owner.email);
  const hasPhone = Boolean(caseData.owner.phone);

  if (hasEmail && hasPhone) {
    // Side by side
    nodes.push({
      id: "email-preview",
      type: "action",
      position: { x: centerX - NODE_WIDTH - HORIZONTAL_GAP / 2, y: currentY },
      data: {
        actionType: "email_pending",
        status: "preview",
        recipientEmail: caseData.owner.email,
      },
    });

    nodes.push({
      id: "call-preview",
      type: "action",
      position: { x: centerX + HORIZONTAL_GAP / 2, y: currentY },
      data: {
        actionType: "call_pending",
        status: "preview",
      },
    });

    edges.push(
      {
        id: "awaiting-email",
        source: "awaiting",
        target: "email-preview",
        type: "animated",
        data: { status: "preview" },
      },
      {
        id: "awaiting-call",
        source: "awaiting",
        target: "call-preview",
        type: "animated",
        data: { status: "preview" },
      },
    );
  } else if (hasEmail) {
    nodes.push({
      id: "email-preview",
      type: "action",
      position: { x: centerX - NODE_WIDTH / 2, y: currentY },
      data: {
        actionType: "email_pending",
        status: "preview",
        recipientEmail: caseData.owner.email,
      },
    });

    edges.push({
      id: "awaiting-email",
      source: "awaiting",
      target: "email-preview",
      type: "animated",
      data: { status: "preview" },
    });
  } else if (hasPhone) {
    nodes.push({
      id: "call-preview",
      type: "action",
      position: { x: centerX - NODE_WIDTH / 2, y: currentY },
      data: {
        actionType: "call_pending",
        status: "preview",
      },
    });

    edges.push({
      id: "awaiting-call",
      source: "awaiting",
      target: "call-preview",
      type: "animated",
      data: { status: "preview" },
    });
  }

  return { nodes, edges, state: "pending_review" };
}

/**
 * Build workflow for email only state
 */
function buildEmailOnlyWorkflow(caseData: CaseDataForWorkflow): WorkflowData {
  const centerX = NODE_WIDTH / 2 + 20;
  let currentY = 0;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Appointment ended
  nodes.push({
    id: "appointment",
    type: "appointment",
    position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    data: {
      caseType: caseData.caseType ?? "Visit",
      timestamp: formatRelativeTime(caseData.timestamp),
    },
  });

  currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

  // Email triggered
  nodes.push({
    id: "email-trigger",
    type: "trigger",
    position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    data: {
      triggerType: "email_triggered",
      timestamp: formatRelativeTime(caseData.scheduledEmailFor),
      status: "completed",
    },
  });

  edges.push({
    id: "appointment-email-trigger",
    source: "appointment",
    target: "email-trigger",
    type: "animated",
    data: { status: "completed" },
  });

  currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

  // Email sent
  nodes.push({
    id: "email-sent",
    type: "action",
    position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    data: {
      actionType: "email_sent",
      status: "completed",
      recipientEmail: caseData.owner.email,
    },
  });

  edges.push({
    id: "email-trigger-sent",
    source: "email-trigger",
    target: "email-sent",
    type: "animated",
    data: { status: "completed" },
  });

  currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

  // Call pending (if phone available)
  if (caseData.owner.phone) {
    nodes.push({
      id: "call-pending",
      type: "action",
      position: { x: centerX - NODE_WIDTH / 2, y: currentY },
      data: {
        actionType: "call_pending",
        status: "preview",
      },
    });

    edges.push({
      id: "email-sent-call",
      source: "email-sent",
      target: "call-pending",
      type: "animated",
      data: { status: "preview" },
    });
  }

  return { nodes, edges, state: "email_only" };
}

/**
 * Build workflow for call only state
 */
function buildCallOnlyWorkflow(caseData: CaseDataForWorkflow): WorkflowData {
  const centerX = NODE_WIDTH / 2 + 20;
  let currentY = 0;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Appointment ended
  nodes.push({
    id: "appointment",
    type: "appointment",
    position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    data: {
      caseType: caseData.caseType ?? "Visit",
      timestamp: formatRelativeTime(caseData.timestamp),
    },
  });

  currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

  // Call triggered
  nodes.push({
    id: "call-trigger",
    type: "trigger",
    position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    data: {
      triggerType: "call_triggered",
      timestamp: formatRelativeTime(caseData.scheduledCallFor),
      status: "completed",
    },
  });

  edges.push({
    id: "appointment-call-trigger",
    source: "appointment",
    target: "call-trigger",
    type: "animated",
    data: { status: "completed" },
  });

  currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

  // Call completed
  nodes.push({
    id: "call-completed",
    type: "action",
    position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    data: {
      actionType: "call_completed",
      status: "completed",
      duration: formatDuration(caseData.scheduledCall?.durationSeconds ?? null),
      recordingUrl: caseData.scheduledCall?.recordingUrl,
      transcript: caseData.scheduledCall?.transcript,
    },
  });

  edges.push({
    id: "call-trigger-completed",
    source: "call-trigger",
    target: "call-completed",
    type: "animated",
    data: { status: "completed" },
  });

  currentY += NODE_HEIGHT_LARGE + VERTICAL_GAP;

  // Sentiment node
  const sentiment = inferSentiment(caseData);
  nodes.push({
    id: "sentiment",
    type: "sentiment",
    position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    data: {
      sentiment,
      summary: caseData.scheduledCall?.summary ?? "Call completed successfully",
    },
  });

  edges.push({
    id: "call-completed-sentiment",
    source: "call-completed",
    target: "sentiment",
    type: "animated",
    data: { status: "completed" },
  });

  currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

  // Email pending (if email available)
  if (caseData.owner.email) {
    nodes.push({
      id: "email-pending",
      type: "action",
      position: { x: centerX - NODE_WIDTH / 2, y: currentY },
      data: {
        actionType: "email_pending",
        status: "preview",
        recipientEmail: caseData.owner.email,
      },
    });

    edges.push({
      id: "sentiment-email",
      source: "sentiment",
      target: "email-pending",
      type: "animated",
      data: { status: "preview" },
    });
  }

  return { nodes, edges, state: "call_only" };
}

/**
 * Build workflow for both sent state (complete)
 */
function buildBothSentWorkflow(caseData: CaseDataForWorkflow): WorkflowData {
  const centerX = NODE_WIDTH + HORIZONTAL_GAP / 2 + 20;
  let currentY = 0;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Appointment ended (centered)
  nodes.push({
    id: "appointment",
    type: "appointment",
    position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    data: {
      caseType: caseData.caseType ?? "Visit",
      timestamp: formatRelativeTime(caseData.timestamp),
    },
  });

  currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

  // Two parallel branches
  const leftX = centerX - NODE_WIDTH - HORIZONTAL_GAP / 2;
  const rightX = centerX + HORIZONTAL_GAP / 2;

  // Email triggered (left)
  nodes.push({
    id: "email-trigger",
    type: "trigger",
    position: { x: leftX, y: currentY },
    data: {
      triggerType: "email_triggered",
      timestamp: formatRelativeTime(caseData.scheduledEmailFor),
      status: "completed",
    },
  });

  // Call triggered (right)
  nodes.push({
    id: "call-trigger",
    type: "trigger",
    position: { x: rightX, y: currentY },
    data: {
      triggerType: "call_triggered",
      timestamp: formatRelativeTime(caseData.scheduledCallFor),
      status: "completed",
    },
  });

  edges.push(
    {
      id: "appointment-email-trigger",
      source: "appointment",
      target: "email-trigger",
      type: "animated",
      data: { status: "completed" },
    },
    {
      id: "appointment-call-trigger",
      source: "appointment",
      target: "call-trigger",
      type: "animated",
      data: { status: "completed" },
    },
  );

  currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

  // Email sent (left)
  nodes.push({
    id: "email-sent",
    type: "action",
    position: { x: leftX, y: currentY },
    data: {
      actionType: "email_sent",
      status: "completed",
      recipientEmail: caseData.owner.email,
    },
  });

  // Call completed (right)
  nodes.push({
    id: "call-completed",
    type: "action",
    position: { x: rightX, y: currentY },
    data: {
      actionType: "call_completed",
      status: "completed",
      duration: formatDuration(caseData.scheduledCall?.durationSeconds ?? null),
      recordingUrl: caseData.scheduledCall?.recordingUrl,
      transcript: caseData.scheduledCall?.transcript,
    },
  });

  edges.push(
    {
      id: "email-trigger-sent",
      source: "email-trigger",
      target: "email-sent",
      type: "animated",
      data: { status: "completed" },
    },
    {
      id: "call-trigger-completed",
      source: "call-trigger",
      target: "call-completed",
      type: "animated",
      data: { status: "completed" },
    },
  );

  currentY += NODE_HEIGHT_LARGE + VERTICAL_GAP;

  // Sentiment node (right side, below call)
  const sentiment = inferSentiment(caseData);
  nodes.push({
    id: "sentiment",
    type: "sentiment",
    position: { x: rightX, y: currentY },
    data: {
      sentiment,
      summary: caseData.scheduledCall?.summary ?? "Call completed successfully",
    },
  });

  edges.push({
    id: "call-completed-sentiment",
    source: "call-completed",
    target: "sentiment",
    type: "animated",
    data: { status: "completed" },
  });

  currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

  // Delivery complete (centered)
  nodes.push({
    id: "status",
    type: "status",
    position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    data: {
      statusType: "complete",
      message: "All communications sent",
    },
  });

  edges.push(
    {
      id: "email-sent-status",
      source: "email-sent",
      target: "status",
      type: "animated",
      data: { status: "completed" },
    },
    {
      id: "sentiment-status",
      source: "sentiment",
      target: "status",
      type: "animated",
      data: { status: "completed" },
    },
  );

  return { nodes, edges, state: "both_sent" };
}

/**
 * Build workflow for attention alert state
 */
function buildWithAttentionWorkflow(
  caseData: CaseDataForWorkflow,
): WorkflowData {
  const centerX = NODE_WIDTH / 2 + 20;
  let currentY = 0;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Appointment ended
  nodes.push({
    id: "appointment",
    type: "appointment",
    position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    data: {
      caseType: caseData.caseType ?? "Visit",
      timestamp: formatRelativeTime(caseData.timestamp),
    },
  });

  currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

  // Call completed (assuming call triggered attention)
  if (caseData.phoneSent === "sent") {
    nodes.push({
      id: "call-completed",
      type: "action",
      position: { x: centerX - NODE_WIDTH / 2, y: currentY },
      data: {
        actionType: "call_completed",
        status: "completed",
        duration: formatDuration(
          caseData.scheduledCall?.durationSeconds ?? null,
        ),
        recordingUrl: caseData.scheduledCall?.recordingUrl,
        transcript: caseData.scheduledCall?.transcript,
      },
    });

    edges.push({
      id: "appointment-call",
      source: "appointment",
      target: "call-completed",
      type: "animated",
      data: { status: "completed" },
    });

    currentY += NODE_HEIGHT_LARGE + VERTICAL_GAP;
  }

  // Attention alert node
  nodes.push({
    id: "attention",
    type: "attention",
    position: { x: centerX - NODE_WIDTH / 2 - 30, y: currentY }, // Slightly wider
    data: {
      severity: caseData.attentionSeverity ?? "urgent",
      types: caseData.attentionTypes ?? [],
      summary: caseData.attentionSummary ?? "This case requires your attention",
    },
  });

  edges.push({
    id:
      caseData.phoneSent === "sent"
        ? "call-attention"
        : "appointment-attention",
    source: caseData.phoneSent === "sent" ? "call-completed" : "appointment",
    target: "attention",
    type: "animated",
    data: { status: "pending" },
  });

  return { nodes, edges, state: "with_attention" };
}

/**
 * Build workflow for failed state
 */
function buildFailedWorkflow(caseData: CaseDataForWorkflow): WorkflowData {
  const centerX = NODE_WIDTH / 2 + 20;
  let currentY = 0;

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const callFailed = caseData.phoneSent === "failed";
  const emailFailed = caseData.emailSent === "failed";

  // Appointment ended
  nodes.push({
    id: "appointment",
    type: "appointment",
    position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    data: {
      caseType: caseData.caseType ?? "Visit",
      timestamp: formatRelativeTime(caseData.timestamp),
    },
  });

  currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

  if (callFailed) {
    // Call triggered
    nodes.push({
      id: "call-trigger",
      type: "trigger",
      position: { x: centerX - NODE_WIDTH / 2, y: currentY },
      data: {
        triggerType: "call_triggered",
        status: "completed",
      },
    });

    edges.push({
      id: "appointment-call-trigger",
      source: "appointment",
      target: "call-trigger",
      type: "animated",
      data: { status: "completed" },
    });

    currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

    // Call failed
    const failureReason = caseData.scheduledCall?.endedReason ?? "Call failed";
    nodes.push({
      id: "call-failed",
      type: "status",
      position: { x: centerX - NODE_WIDTH / 2, y: currentY },
      data: {
        statusType: "failed",
        message: getFailureMessage(failureReason),
      },
    });

    edges.push({
      id: "call-trigger-failed",
      source: "call-trigger",
      target: "call-failed",
      type: "animated",
      data: { status: "failed" },
    });
  } else if (emailFailed) {
    // Email triggered
    nodes.push({
      id: "email-trigger",
      type: "trigger",
      position: { x: centerX - NODE_WIDTH / 2, y: currentY },
      data: {
        triggerType: "email_triggered",
        status: "completed",
      },
    });

    edges.push({
      id: "appointment-email-trigger",
      source: "appointment",
      target: "email-trigger",
      type: "animated",
      data: { status: "completed" },
    });

    currentY += NODE_HEIGHT_SMALL + VERTICAL_GAP;

    // Email failed
    nodes.push({
      id: "email-failed",
      type: "status",
      position: { x: centerX - NODE_WIDTH / 2, y: currentY },
      data: {
        statusType: "failed",
        message: "Email delivery failed",
      },
    });

    edges.push({
      id: "email-trigger-failed",
      source: "email-trigger",
      target: "email-failed",
      type: "animated",
      data: { status: "failed" },
    });
  }

  return { nodes, edges, state: "failed" };
}

/**
 * Get user-friendly failure message from ended reason
 */
function getFailureMessage(endedReason: string): string {
  const reason = endedReason.toLowerCase();

  if (reason.includes("no-answer") || reason.includes("did-not-answer")) {
    return "No answer";
  }
  if (reason.includes("busy")) {
    return "Line busy";
  }
  if (reason.includes("voicemail")) {
    return "Voicemail";
  }
  if (reason.includes("silence")) {
    return "No response";
  }
  if (reason.includes("error") || reason.includes("failed")) {
    return "Connection error";
  }

  return "Call failed";
}

/**
 * Main function to build workflow from case data
 */
export function buildWorkflow(caseData: CaseDataForWorkflow): WorkflowData {
  const state = determineSidebarState(caseData);

  switch (state) {
    case "pending_review":
      return buildPendingReviewWorkflow(caseData);
    case "email_only":
      return buildEmailOnlyWorkflow(caseData);
    case "call_only":
      return buildCallOnlyWorkflow(caseData);
    case "both_sent":
      return buildBothSentWorkflow(caseData);
    case "with_attention":
      return buildWithAttentionWorkflow(caseData);
    case "failed":
      return buildFailedWorkflow(caseData);
    default:
      return buildPendingReviewWorkflow(caseData);
  }
}
