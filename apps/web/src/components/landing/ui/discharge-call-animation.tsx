"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Check, Clock, RotateCcw, PhoneCall } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

// =============================================================================
// Types
// =============================================================================

type CallStatus = "queued" | "calling" | "completed" | "retry";

interface CallItem {
  id: string;
  petName: string;
  ownerName: string;
  procedure: string;
  status: CallStatus;
  retryCount: number;
  avatar: string;
}

// =============================================================================
// Mock Data
// =============================================================================

const initialCalls: CallItem[] = [
  {
    id: "1",
    petName: "Max",
    ownerName: "Sarah Johnson",
    procedure: "Post-surgery",
    status: "queued",
    retryCount: 0,
    avatar: "MJ",
  },
  {
    id: "2",
    petName: "Luna",
    ownerName: "Mike Chen",
    procedure: "Dental cleaning",
    status: "queued",
    retryCount: 0,
    avatar: "MC",
  },
  {
    id: "3",
    petName: "Bella",
    ownerName: "Emily Davis",
    procedure: "Vaccination",
    status: "queued",
    retryCount: 0,
    avatar: "ED",
  },
  {
    id: "4",
    petName: "Charlie",
    ownerName: "James Wilson",
    procedure: "Neuter recovery",
    status: "queued",
    retryCount: 0,
    avatar: "JW",
  },
  {
    id: "5",
    petName: "Daisy",
    ownerName: "Anna Roberts",
    procedure: "Allergy treatment",
    status: "queued",
    retryCount: 0,
    avatar: "AR",
  },
];

// =============================================================================
// Utility Components
// =============================================================================

const PulseRing = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="absolute inset-0 rounded-full border-2 border-teal-400"
    initial={{ scale: 1, opacity: 0.6 }}
    animate={{ scale: 2.5, opacity: 0 }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      delay,
      ease: "easeOut",
    }}
  />
);

const SoundWave = ({ index }: { index: number }) => (
  <motion.div
    className="h-full w-1 rounded-full bg-teal-400"
    animate={{
      scaleY: [0.3, 1, 0.5, 0.8, 0.3],
    }}
    transition={{
      duration: 0.8,
      repeat: Infinity,
      delay: index * 0.1,
      ease: "easeInOut",
    }}
  />
);

// =============================================================================
// Status Badge Component
// =============================================================================

const StatusBadge = ({ status }: { status: CallStatus }) => {
  const config = {
    queued: {
      icon: Clock,
      label: "Queued",
      bg: "bg-slate-100",
      text: "text-slate-600",
      ring: "ring-slate-200",
    },
    calling: {
      icon: PhoneCall,
      label: "Calling",
      bg: "bg-teal-500",
      text: "text-white",
      ring: "ring-teal-400",
    },
    completed: {
      icon: Check,
      label: "Done",
      bg: "bg-emerald-500",
      text: "text-white",
      ring: "ring-emerald-400",
    },
    retry: {
      icon: RotateCcw,
      label: "Retry",
      bg: "bg-amber-500",
      text: "text-white",
      ring: "ring-amber-400",
    },
  };

  const { icon: Icon, label, bg, text, ring } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
        bg,
        text,
        ring,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
};

// =============================================================================
// Queue Card Component
// =============================================================================

const QueueCard = ({
  call,
  isActive,
}: {
  call: CallItem;
  isActive: boolean;
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.9 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: isActive ? 1.02 : 1,
      }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      transition={{
        layout: { type: "spring", stiffness: 500, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      }}
      className={cn(
        "relative flex items-center gap-2 rounded-lg border p-2 transition-colors",
        isActive
          ? "border-teal-300 bg-gradient-to-r from-teal-50 to-emerald-50 shadow-md shadow-teal-500/10"
          : "border-slate-100 bg-white/80",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          isActive
            ? "bg-gradient-to-br from-teal-400 to-emerald-500 text-white"
            : "bg-slate-100 text-slate-600",
        )}
      >
        {call.avatar}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-800">
          {call.petName}
        </p>
        <p className="truncate text-[10px] text-slate-500">{call.procedure}</p>
      </div>

      {/* Status */}
      <StatusBadge status={call.status} />

      {/* Retry indicator */}
      {call.retryCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white">
          {call.retryCount}
        </span>
      )}
    </motion.div>
  );
};

// =============================================================================
// Active Call Display Component
// =============================================================================

const ActiveCallDisplay = ({ call }: { call: CallItem | null }) => {
  if (!call) return null;

  return (
    <motion.div
      key={call.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-3"
    >
      {/* Animated Phone Icon */}
      <div className="relative">
        <PulseRing delay={0} />
        <PulseRing delay={0.5} />
        <PulseRing delay={1} />
        <motion.div
          className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-500/30"
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          <Phone className="h-6 w-6 text-white" />
        </motion.div>
      </div>

      {/* Sound Wave Visualization */}
      <div className="flex h-6 items-center gap-0.5">
        {[...Array(7)].map((_, i) => (
          <SoundWave key={i} index={i} />
        ))}
      </div>

      {/* Call Info */}
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-800">{call.petName}</p>
        <p className="text-xs text-slate-500">{call.ownerName}</p>
        <motion.p
          className="mt-1 text-[10px] font-medium text-teal-600"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Connecting...
        </motion.p>
      </div>
    </motion.div>
  );
};

// =============================================================================
// Completed Stack Component
// =============================================================================

const CompletedStack = ({ calls }: { calls: CallItem[] }) => {
  const displayCalls = calls.slice(-4);

  return (
    <div className="relative flex flex-col gap-1">
      <AnimatePresence mode="popLayout">
        {displayCalls.map((call, index) => (
          <motion.div
            key={call.id}
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{
              opacity: 1 - index * 0.15,
              y: 0,
              scale: 1 - index * 0.02,
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-emerald-200/50 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 p-2",
            )}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-3 w-3" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-700">
                {call.petName}
              </p>
            </div>
            <span className="text-[10px] font-medium text-emerald-600">
              Done
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Overflow indicator */}
      {calls.length > 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-[10px] font-medium text-slate-400"
        >
          +{calls.length - 4} more completed
        </motion.div>
      )}
    </div>
  );
};

// =============================================================================
// Stats Bar Component
// =============================================================================

const StatsBar = ({
  queued,
  completed,
  retries,
}: {
  queued: number;
  completed: number;
  retries: number;
}) => {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white/60 px-3 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="text-[10px] font-medium text-slate-500">
          Queued: {queued}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-teal-400" />
        <span className="text-[10px] font-medium text-slate-500">
          Active: 1
        </span>
      </div>
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-[10px] font-medium text-slate-500">
          Done: {completed}
        </span>
      </div>
      {retries > 0 && (
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-[10px] font-medium text-slate-500">
            Retries: {retries}
          </span>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export function DischargeCallAnimation() {
  const [calls, setCalls] = useState<CallItem[]>(initialCalls);
  const [activeCall, setActiveCall] = useState<CallItem | null>(null);
  const [completedCalls, setCompletedCalls] = useState<CallItem[]>([]);
  const [cycleCount, setCycleCount] = useState(0);

  // Get queued calls
  const queuedCalls = calls.filter(
    (c) => c.status === "queued" || c.status === "retry",
  );

  // Process next call in queue
  const processNextCall = useCallback(() => {
    if (activeCall) return;

    // First check for retry calls (priority)
    const retryCall = calls.find((c) => c.status === "retry");
    const queuedCall = calls.find((c) => c.status === "queued");
    const nextCall = retryCall ?? queuedCall;

    if (nextCall) {
      setCalls((prev) =>
        prev.map((c) =>
          c.id === nextCall.id ? { ...c, status: "calling" as CallStatus } : c,
        ),
      );
      setActiveCall({ ...nextCall, status: "calling" });
    }
  }, [activeCall, calls]);

  // Complete active call
  const completeActiveCall = useCallback(() => {
    if (!activeCall) return;

    // 20% chance of needing retry (simulate no-answer)
    const needsRetry = Math.random() < 0.2 && activeCall.retryCount < 2;

    if (needsRetry) {
      // Move to retry queue
      setCalls((prev) =>
        prev.map((c) =>
          c.id === activeCall.id
            ? {
                ...c,
                status: "retry" as CallStatus,
                retryCount: c.retryCount + 1,
              }
            : c,
        ),
      );
    } else {
      // Mark as completed
      setCalls((prev) => prev.filter((c) => c.id !== activeCall.id));
      setCompletedCalls((prev) => [
        ...prev,
        { ...activeCall, status: "completed" },
      ]);
    }

    setActiveCall(null);
  }, [activeCall]);

  // Reset animation when all calls are processed
  const resetAnimation = useCallback(() => {
    setCycleCount((prev) => prev + 1);
    setCalls(
      initialCalls.map((c) => ({
        ...c,
        status: "queued" as CallStatus,
        retryCount: 0,
      })),
    );
    setCompletedCalls([]);
    setActiveCall(null);
  }, []);

  // Main animation loop
  useEffect(() => {
    // Check if all calls are processed
    if (calls.length === 0 && !activeCall) {
      const resetTimeout = setTimeout(resetAnimation, 2000);
      return () => clearTimeout(resetTimeout);
    }

    // Start next call if none active
    if (!activeCall && calls.length > 0) {
      const startTimeout = setTimeout(processNextCall, 800);
      return () => clearTimeout(startTimeout);
    }

    // Complete active call after "calling" duration
    if (activeCall) {
      const completeTimeout = setTimeout(completeActiveCall, 2500);
      return () => clearTimeout(completeTimeout);
    }
  }, [
    activeCall,
    calls.length,
    processNextCall,
    completeActiveCall,
    resetAnimation,
  ]);

  return (
    <div className="relative flex h-full w-full flex-col gap-3 overflow-hidden p-4">
      {/* Stats Bar */}
      <StatsBar
        queued={queuedCalls.length}
        completed={completedCalls.length}
        retries={calls.filter((c) => c.retryCount > 0).length}
      />

      {/* Main Content Grid */}
      <div className="grid flex-1 grid-cols-3 gap-3">
        {/* Queue Column */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 px-1">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
              Queue
            </span>
          </div>
          <div className="flex flex-col gap-1.5 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {queuedCalls.slice(0, 4).map((call) => (
                <QueueCard key={call.id} call={call} isActive={false} />
              ))}
            </AnimatePresence>
            {queuedCalls.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-400"
              >
                Queue empty
              </motion.div>
            )}
          </div>
        </div>

        {/* Active Call Column */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center gap-1.5 px-1">
            <PhoneCall className="h-3 w-3 text-teal-500" />
            <span className="text-[10px] font-semibold tracking-wide text-teal-600 uppercase">
              Active
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <AnimatePresence mode="wait">
              {activeCall ? (
                <ActiveCallDisplay call={activeCall} />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-slate-200">
                    <Phone className="h-5 w-5 text-slate-300" />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Ready for next call
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Completed Column */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-end gap-1.5 px-1">
            <Check className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] font-semibold tracking-wide text-emerald-600 uppercase">
              Done
            </span>
          </div>
          <div className="flex flex-col gap-1.5 overflow-hidden">
            {completedCalls.length > 0 ? (
              <CompletedStack calls={completedCalls} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-400"
              >
                No calls yet
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500"
          initial={{ width: "0%" }}
          animate={{
            width: `${(completedCalls.length / initialCalls.length) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Cycle indicator (subtle) */}
      {cycleCount > 0 && (
        <div className="absolute right-2 bottom-1 text-[8px] text-slate-300">
          Batch {cycleCount + 1}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Export Skeleton Wrapper for Feature Section
// =============================================================================

export const DischargeCallAnimationSkeleton = () => {
  return <DischargeCallAnimation />;
};
