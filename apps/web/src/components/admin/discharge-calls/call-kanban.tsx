"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Badge } from "@odis-ai/ui/badge";
import { Button } from "@odis-ai/ui/button";
import { ScrollArea } from "@odis-ai/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@odis-ai/ui/dialog";
import {
  ThumbsUp,
  ThumbsDown,
  Voicemail,
  PhoneMissed,
  Clock,
  Flag,
  Play,
  Pause,
  GripVertical,
  Phone,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import type { ReviewCategory } from "~/server/api/routers/admin-discharge-calls";

interface CallData {
  id: string;
  reviewCategory: ReviewCategory;
  patientName: string;
  ownerName: string;
  durationSeconds: number | null;
  endedReason: string | null;
  createdAt: string;
  recordingUrl: string | null;
  transcript: string | null;
  summary: string | null;
  customerPhone: string | null;
  caseId: string | null;
}

interface CallKanbanProps {
  calls: CallData[];
  onCategoryChange: (callId: string, category: ReviewCategory) => void;
  isUpdating: boolean;
  onPlayAudio: (callId: string, url: string) => void;
  currentPlayingId?: string | null;
  onStopAudio?: () => void;
}

const columns: {
  id: ReviewCategory;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    id: "to_review",
    title: "To Review",
    icon: Clock,
    color: "border-slate-200 bg-slate-50",
  },
  {
    id: "good",
    title: "Good",
    icon: ThumbsUp,
    color: "border-emerald-200 bg-emerald-50",
  },
  {
    id: "bad",
    title: "Bad",
    icon: ThumbsDown,
    color: "border-red-200 bg-red-50",
  },
  {
    id: "voicemail",
    title: "Voicemail",
    icon: Voicemail,
    color: "border-amber-200 bg-amber-50",
  },
  {
    id: "no_answer",
    title: "No Answer",
    icon: PhoneMissed,
    color: "border-orange-200 bg-orange-50",
  },
  {
    id: "needs_followup",
    title: "Follow-up",
    icon: Flag,
    color: "border-purple-200 bg-purple-50",
  },
];

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function SortableCallCard({
  call,
  onPlayAudio,
  onClick,
}: {
  call: CallData;
  onPlayAudio: (callId: string, url: string) => void;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: call.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group mb-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? "shadow-lg ring-2 ring-teal-500" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-slate-500 hover:text-slate-700 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1 cursor-pointer" onClick={onClick}>
          <div className="flex items-center justify-between">
            <span className="truncate font-semibold text-slate-900">
              {call.patientName}
            </span>
            {call.recordingUrl && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-slate-900"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayAudio(call.id, call.recordingUrl!);
                }}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
          </div>
          <span className="text-xs font-medium text-slate-600">
            {call.ownerName}
          </span>
          <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>{formatDuration(call.durationSeconds)}</span>
            <span>•</span>
            <span>{format(new Date(call.createdAt), "MMM d")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  calls,
  onPlayAudio,
  onCardClick,
}: {
  column: (typeof columns)[0];
  calls: CallData[];
  onPlayAudio: (callId: string, url: string) => void;
  onCardClick: (call: CallData) => void;
}) {
  const Icon = column.icon;

  return (
    <Card
      className={`flex h-full min-w-[220px] flex-col border ${column.color}`}
    >
      <CardHeader className="flex-none px-3 py-2">
        <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-900">
          <span className="flex items-center gap-2 text-slate-900">
            <Icon className="h-4 w-4 text-slate-700" />
            {column.title}
          </span>
          <Badge
            variant="secondary"
            className="text-xs font-medium text-slate-700"
          >
            {calls.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden px-2 pb-2">
        <ScrollArea className="h-full">
          <SortableContext
            items={calls.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {calls.map((call) => (
              <SortableCallCard
                key={call.id}
                call={call}
                onPlayAudio={onPlayAudio}
                onClick={() => onCardClick(call)}
              />
            ))}
          </SortableContext>
          {calls.length === 0 && (
            <div className="flex h-20 items-center justify-center text-xs font-medium text-slate-500">
              Drop calls here
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function CallKanban({
  calls,
  onCategoryChange,
  isUpdating: _isUpdating,
  onPlayAudio,
  currentPlayingId,
  onStopAudio,
}: CallKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<CallData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeCall = activeId ? calls.find((c) => c.id === activeId) : null;
  const isPlaying = selectedCall && currentPlayingId === selectedCall.id;

  function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");
    const match = /^(\d{3})(\d{3})(\d{4})$/.exec(cleaned);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const callId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = columns.find((col) => col.id === overId);
    if (targetColumn) {
      const call = calls.find((c) => c.id === callId);
      if (call && call.reviewCategory !== targetColumn.id) {
        onCategoryChange(callId, targetColumn.id);
      }
      return;
    }

    // Check if dropped on another call - get its column
    const targetCall = calls.find((c) => c.id === overId);
    if (targetCall) {
      const call = calls.find((c) => c.id === callId);
      if (call && call.reviewCategory !== targetCall.reviewCategory) {
        onCategoryChange(callId, targetCall.reviewCategory);
      }
    }
  };

  // Group calls by category
  const callsByCategory = columns.reduce(
    (acc, col) => {
      acc[col.id] = calls.filter((c) => c.reviewCategory === col.id);
      return acc;
    },
    {} as Record<ReviewCategory, CallData[]>,
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-3 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              calls={callsByCategory[column.id]}
              onPlayAudio={onPlayAudio}
              onCardClick={setSelectedCall}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCall && (
            <div className="rounded-lg border-2 border-teal-500 bg-white p-3 shadow-xl ring-2 ring-teal-200">
              <div className="font-semibold text-slate-900">
                {activeCall.patientName}
              </div>
              <div className="text-xs font-medium text-slate-600">
                {activeCall.ownerName}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Call Details Dialog */}
      <Dialog
        open={!!selectedCall}
        onOpenChange={(open) => !open && setSelectedCall(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedCall && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between text-slate-900">
                  <span className="font-bold">{selectedCall.patientName}</span>
                  {selectedCall.recordingUrl && (
                    <Button
                      size="sm"
                      variant={isPlaying ? "default" : "outline"}
                      onClick={() =>
                        isPlaying && onStopAudio
                          ? onStopAudio()
                          : onPlayAudio(
                              selectedCall.id,
                              selectedCall.recordingUrl!,
                            )
                      }
                      className="gap-2"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Play Recording
                        </>
                      )}
                    </Button>
                  )}
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  Owner: {selectedCall.ownerName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Call Metadata */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-slate-700">
                      Duration
                    </h4>
                    <p className="text-sm text-slate-600">
                      {formatDuration(selectedCall.durationSeconds)}
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-slate-700">
                      Date
                    </h4>
                    <p className="text-sm text-slate-600">
                      {format(
                        new Date(selectedCall.createdAt),
                        "MMM d, yyyy 'at' h:mm a",
                      )}
                    </p>
                  </div>
                  {selectedCall.customerPhone && (
                    <div>
                      <h4 className="mb-1 text-sm font-semibold text-slate-700">
                        <Phone className="mr-1 inline h-3.5 w-3.5" />
                        Phone
                      </h4>
                      <p className="text-sm text-slate-600">
                        {formatPhoneNumber(selectedCall.customerPhone)}
                      </p>
                    </div>
                  )}
                  {selectedCall.caseId && (
                    <div>
                      <h4 className="mb-1 text-sm font-semibold text-slate-700">
                        Case
                      </h4>
                      <a
                        href={`/dashboard/discharges/${selectedCall.caseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
                      >
                        View Case
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Summary */}
                {selectedCall.summary && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-700">
                      Summary
                    </h4>
                    <p className="text-sm text-slate-600">
                      {selectedCall.summary}
                    </p>
                  </div>
                )}

                {/* Transcript */}
                {selectedCall.transcript && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-700">
                      Full Transcript
                    </h4>
                    <ScrollArea className="h-[300px] rounded-md border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm whitespace-pre-wrap text-slate-600">
                        {selectedCall.transcript}
                      </p>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
