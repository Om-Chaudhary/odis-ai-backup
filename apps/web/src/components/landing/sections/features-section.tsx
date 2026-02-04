"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";
import {
  Phone,
  Zap,
  ArrowRight,
  Shield,
  Calendar as CalendarIcon,
  Clock,
  Check,
  TrendingUp,
  Star,
  Mic,
  Activity,
  Database,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Bot,
  Volume2,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@odis-ai/shared/util";
import { Calendar } from "@odis-ai/shared/ui";
import { SectionBackground } from "../ui/section-background";
import { NumberTicker } from "../ui/number-ticker";
import { BlurFade } from "../ui/blur-fade";
import { DischargeCallAnimation } from "../ui/discharge-call-animation";

// =============================================================================
// Animation Variants
// =============================================================================

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

// =============================================================================
// Enhanced Skeleton Components
// =============================================================================

// Voice Wave Animation - AI-Powered Voice with Audio Waveforms
const VoiceWaveSkeleton = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState(0);

  const phrases = [
    "How can I help you today?",
    "Let me check that for you...",
    "Your appointment is confirmed!",
    "Is there anything else?",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentPhrase((prev) => (prev + 1) % phrases.length);
      }, 1500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden p-4">
      {/* AI Brain Indicator */}
      <motion.div
        className="absolute top-4 right-4 flex items-center gap-1.5"
        animate={{ opacity: isProcessing ? 1 : 0.5 }}
      >
        <motion.div
          animate={isProcessing ? { rotate: 360 } : { rotate: 0 }}
          transition={{
            duration: 1,
            repeat: isProcessing ? Infinity : 0,
            ease: "linear",
          }}
        >
          <Bot className="h-4 w-4 text-teal-500" />
        </motion.div>
        <span className="text-[10px] font-medium text-teal-600">
          {isProcessing ? "Processing..." : "AI Ready"}
        </span>
      </motion.div>

      {/* Main Voice Interface */}
      <div className="relative flex items-center justify-center">
        {/* Outer Pulse Rings */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-teal-400/30"
            style={{
              width: 80 + i * 40,
              height: 80 + i * 40,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3 - i * 0.05, 0.5 - i * 0.05, 0.3 - i * 0.05],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Center Voice Button */}
        <motion.div
          className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 shadow-xl shadow-teal-500/40"
          animate={{
            scale: isProcessing ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: isProcessing ? Infinity : 0,
          }}
        >
          <motion.div
            animate={isProcessing ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3, repeat: isProcessing ? Infinity : 0 }}
          >
            {isProcessing ? (
              <Sparkles className="h-8 w-8 text-white" />
            ) : (
              <Mic className="h-8 w-8 text-white" />
            )}
          </motion.div>

          {/* Active Indicator */}
          <motion.div
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400"
            animate={{
              scale: [1, 1.2, 1],
              boxShadow: [
                "0 0 0 0 rgba(52, 211, 153, 0.7)",
                "0 0 0 8px rgba(52, 211, 153, 0)",
                "0 0 0 0 rgba(52, 211, 153, 0)",
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </div>

      {/* Audio Waveform Visualization */}
      <div className="flex h-10 items-center justify-center gap-1">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-teal-400 to-emerald-400"
            animate={{
              height: isProcessing
                ? [8, 20 + Math.random() * 20, 12, 28 + Math.random() * 12, 8]
                : [8, 12, 8],
            }}
            transition={{
              duration: isProcessing ? 0.4 : 1,
              repeat: Infinity,
              delay: i * 0.05,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* AI Response Text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhrase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm"
        >
          <Volume2 className="h-3 w-3 text-teal-500" />
          <span className="text-xs font-medium text-slate-700">
            {phrases[currentPhrase]}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Status Badge */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-[10px] font-medium text-emerald-700">
            24/7 Active
          </span>
        </div>
      </div>
    </div>
  );
};

// Call Activity List - Live Real-Time Notifications
const CallActivitySkeleton = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      name: "Discharge call completed",
      description: "Max (Golden Retriever)",
      time: "Just now",
      icon: "checkmark",
      color: "#10b981",
      isNew: true,
    },
    {
      id: 2,
      name: "Appointment booked",
      description: "Luna - Follow-up checkup",
      time: "2m ago",
      icon: "calendar",
      color: "#14b8a6",
      isNew: false,
    },
    {
      id: 3,
      name: "Owner sentiment: Grateful",
      description: "Bella's post-op call",
      time: "4m ago",
      icon: "heart",
      color: "#8b5cf6",
      isNew: false,
    },
    {
      id: 4,
      name: "Follow-up reminder sent",
      description: "Charlie - Medication refill",
      time: "6m ago",
      icon: "bell",
      color: "#0ea5e9",
      isNew: false,
    },
  ]);

  const getIconSymbol = (icon: string) => {
    switch (icon) {
      case "checkmark":
        return "\u2713";
      case "calendar":
        return "\u{1F4C5}";
      case "heart":
        return "\u2665";
      case "bell":
        return "\u{1F514}";
      case "note":
        return "\u{1F4DD}";
      case "refresh":
        return "\u{1F504}";
      case "clock":
        return "\u23F0";
      default:
        return "\u2022";
    }
  };

  // Cycle through highlighting different notifications
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % notifications.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [notifications.length]);

  // Occasionally add a new notification at the top
  useEffect(() => {
    const newNotifs = [
      {
        name: "Voicemail transcribed",
        description: "Daisy's owner",
        icon: "note",
        color: "#f59e0b",
      },
      {
        name: "Call transferred",
        description: "Emergency line",
        icon: "refresh",
        color: "#ef4444",
      },
      {
        name: "Callback scheduled",
        description: "Rocky - 3:00 PM",
        icon: "clock",
        color: "#6366f1",
      },
    ];

    const interval = setInterval(() => {
      const newNotif = newNotifs[Math.floor(Math.random() * newNotifs.length)];
      if (!newNotif) return;
      setNotifications((prev) => [
        {
          id: Date.now(),
          name: newNotif.name,
          description: newNotif.description,
          icon: newNotif.icon,
          color: newNotif.color,
          time: "Just now",
          isNew: true,
        },
        ...prev.slice(0, 3).map((n) => ({ ...n, isNew: false })),
      ]);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col gap-2 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-teal-500" />
          <span className="text-xs font-semibold text-slate-700">
            Live Activity
          </span>
        </div>
        <motion.div
          className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-medium text-emerald-700">Live</span>
        </motion.div>
      </div>

      {/* Notifications List */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {notifications.map((notif, idx) => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: activeIndex === idx ? 1.02 : 1,
              }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{
                layout: { type: "spring", stiffness: 500, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className={cn(
                "group relative flex items-start gap-3 rounded-xl border p-3 transition-all duration-300",
                activeIndex === idx
                  ? "border-teal-200 bg-gradient-to-r from-teal-50/80 to-emerald-50/60 shadow-md shadow-teal-500/10"
                  : "border-slate-100 bg-white/80 hover:border-teal-100 hover:bg-white",
              )}
            >
              {/* New indicator */}
              {notif.isNew && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -left-1 h-3 w-3 rounded-full bg-teal-500"
                />
              )}

              {/* Icon */}
              <motion.div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-sm transition-transform duration-300"
                style={{ backgroundColor: `${notif.color}15` }}
                animate={activeIndex === idx ? { scale: [1, 1.1, 1] } : {}}
                transition={{
                  duration: 0.5,
                  repeat: activeIndex === idx ? Infinity : 0,
                  repeatDelay: 2,
                }}
              >
                {getIconSymbol(notif.icon)}
              </motion.div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {notif.name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {notif.description}
                </p>
              </div>

              {/* Time */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] whitespace-nowrap text-slate-400">
                  {notif.time}
                </span>
                {activeIndex === idx && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-0.5"
                  >
                    <ChevronRight className="h-3 w-3 text-teal-500" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// PIMS Integration - Animated Data Flow
const PimsIntegrationSkeleton = () => {
  const [syncPhase, setSyncPhase] = useState(0);
  const [dataPackets, setDataPackets] = useState<number[]>([]);

  const pimsSystems = [
    { name: "IDEXX Neo", color: "from-blue-400 to-blue-600" },
    { name: "ezyVet", color: "from-purple-400 to-purple-600" },
    { name: "Cornerstone", color: "from-orange-400 to-orange-600" },
  ];

  // Cycle through sync phases
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncPhase((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Generate data packets
  useEffect(() => {
    const interval = setInterval(() => {
      setDataPackets((prev) => {
        const newPackets = [...prev, Date.now()];
        return newPackets.slice(-5);
      });
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex h-full w-full items-center justify-center gap-4 overflow-hidden p-6">
      {/* Left Side - PIMS Systems */}
      <div className="flex flex-col gap-3">
        {pimsSystems.map((pims, idx) => (
          <motion.div
            key={pims.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "relative flex items-center gap-2 rounded-xl border border-slate-100 bg-white/90 px-3 py-2 shadow-sm transition-all",
              syncPhase === idx + 1 &&
                "border-teal-300 shadow-md shadow-teal-500/10",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br",
                pims.color,
              )}
            >
              <Database className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">
                {pims.name}
              </p>
              <p className="text-[10px] text-slate-400">Connected</p>
            </div>
            {syncPhase === idx + 1 && (
              <motion.div
                className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-teal-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Center - Data Flow Animation */}
      <div className="relative flex h-full w-24 items-center justify-center">
        {/* Connection Lines */}
        <div className="absolute h-full w-0.5 bg-gradient-to-b from-teal-200 via-teal-400 to-teal-200" />

        {/* Data Packets */}
        <AnimatePresence>
          {dataPackets.map((id, idx) => (
            <motion.div
              key={id}
              className="absolute h-2 w-2 rounded-full bg-teal-500 shadow-lg shadow-teal-500/50"
              initial={{ left: "0%", opacity: 0, scale: 0 }}
              animate={{
                left: "100%",
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1, 1, 0.5],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
              }}
              style={{
                top: `${20 + (idx % 3) * 30}%`,
              }}
            />
          ))}
        </AnimatePresence>

        {/* Sync Arrows */}
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="h-0.5 w-16 rounded-full bg-gradient-to-r from-teal-300 to-emerald-400"
              animate={{
                scaleX: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
              style={{ transformOrigin: "left" }}
            />
          ))}
        </div>
      </div>

      {/* Right Side - ODIS AI Hub */}
      <motion.div
        className="relative flex flex-col items-center gap-2"
        animate={{
          scale: syncPhase === 0 ? [1, 1.05, 1] : 1,
        }}
        transition={{ duration: 0.5, repeat: syncPhase === 0 ? Infinity : 0 }}
      >
        <div className="relative">
          {/* Outer glow */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 blur-xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Main hub */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 shadow-xl shadow-teal-500/30">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Shield className="h-10 w-10 text-white" />
            </motion.div>
          </div>

          {/* Sync indicator */}
          <motion.div
            className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-lg"
            animate={{ rotate: syncPhase > 0 ? 360 : 0 }}
            transition={{ duration: 1, ease: "linear" }}
          >
            <RefreshCw
              className={cn(
                "h-3 w-3",
                syncPhase > 0 ? "text-teal-500" : "text-slate-400",
              )}
            />
          </motion.div>
        </div>

        <div className="text-center">
          <p className="text-xs font-semibold text-slate-700">ODIS AI</p>
          <motion.p
            className="text-[10px] text-teal-600"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {syncPhase === 0
              ? "All synced"
              : `Syncing ${pimsSystems[syncPhase - 1]?.name}...`}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

// Analytics Preview - Animated Metrics Dashboard
const AnalyticsSkeleton = () => {
  const [callsToday, setCallsToday] = useState(47);
  const [connectedRate, setConnectedRate] = useState(94);
  const [satisfaction, setSatisfaction] = useState(4.9);

  // Animate numbers changing periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCallsToday((prev) => prev + Math.floor(Math.random() * 3));
      setConnectedRate((prev) =>
        Math.min(99, Math.max(90, prev + (Math.random() > 0.5 ? 1 : -1))),
      );
      setSatisfaction((prev) => {
        const newVal = prev + (Math.random() > 0.5 ? 0.1 : -0.1);
        return Math.round(Math.min(5, Math.max(4.7, newVal)) * 10) / 10;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Mini sparkline data
  const sparklineData = [40, 45, 42, 48, 44, 50, 47, 52, 49, 55, 51, 58];

  return (
    <div className="relative flex h-full w-full flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-teal-500" />
          <span className="text-xs font-semibold text-slate-700">
            Today's Performance
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-[10px] font-medium text-emerald-700">
            Real-time
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid flex-1 grid-cols-3 gap-4">
        {/* Calls Today */}
        <motion.div
          className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 p-3"
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            className="flex items-center gap-1"
            key={callsToday}
            initial={{ scale: 1.2, color: "#14b8a6" }}
            animate={{ scale: 1, color: "#0f766e" }}
            transition={{ duration: 0.3 }}
          >
            <Phone className="h-4 w-4 text-teal-600" />
            <span className="text-3xl font-bold text-teal-700">
              <NumberTicker value={callsToday} />
            </span>
          </motion.div>
          <p className="mt-1 text-xs font-medium text-teal-600">Calls Today</p>

          {/* Mini Sparkline */}
          <div className="mt-2 flex h-6 items-end gap-0.5">
            {sparklineData.map((val, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-teal-400"
                initial={{ height: 0 }}
                animate={{ height: (val / 60) * 24 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              />
            ))}
          </div>
        </motion.div>

        {/* Connected Rate */}
        <motion.div
          className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3"
          whileHover={{ scale: 1.02 }}
        >
          <div className="relative flex items-center justify-center">
            {/* Circular Progress */}
            <svg className="h-16 w-16 -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#d1fae5"
                strokeWidth="4"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: connectedRate / 100 }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  strokeDasharray: "176",
                  strokeDashoffset: "0",
                }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-bold text-emerald-700">
                <NumberTicker value={connectedRate} />%
              </span>
            </div>
          </div>
          <p className="mt-1 text-xs font-medium text-emerald-600">Connected</p>
        </motion.div>

        {/* Satisfaction */}
        <motion.div
          className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 p-3"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-violet-400 text-violet-400" />
            <span className="text-3xl font-bold text-violet-700">
              <NumberTicker value={satisfaction} decimalPlaces={1} />
            </span>
            <span className="text-lg text-slate-400">/5</span>
          </div>
          <p className="mt-1 text-xs font-medium text-violet-600">
            Satisfaction
          </p>

          {/* Star Rating */}
          <div className="mt-2 flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Star
                  className={cn(
                    "h-3 w-3",
                    i < Math.floor(satisfaction)
                      ? "fill-violet-400 text-violet-400"
                      : "fill-slate-200 text-slate-200",
                  )}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Smart Scheduling - Interactive Booking Flow
const SchedulingSkeleton = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [bookingStep, setBookingStep] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const timeSlots = ["9:00 AM", "10:30 AM", "2:00 PM", "3:30 PM"];
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Simulate booking flow
  useEffect(() => {
    const interval = setInterval(() => {
      setBookingStep((prev) => {
        if (prev === 0) {
          const randomSlot =
            timeSlots[Math.floor(Math.random() * timeSlots.length)];
          setSelectedSlot(randomSlot ?? null);
          return 1;
        } else if (prev === 1) {
          setShowConfirmation(true);
          return 2;
        } else {
          setShowConfirmation(false);
          setSelectedSlot(null);
          return 0;
        }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex h-full w-full items-center justify-center gap-4 overflow-hidden p-4">
      {/* Calendar */}
      <motion.div
        animate={{
          scale: bookingStep === 0 ? 1.02 : 1,
          opacity: showConfirmation ? 0.5 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-xl border border-slate-200 bg-white shadow-sm"
        />
      </motion.div>

      {/* Time Slots Panel */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 pb-1">
          <Clock className="h-4 w-4 text-teal-500" />
          <span className="text-xs font-semibold text-slate-700">
            Available Times
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {timeSlots.map((slot, idx) => (
            <motion.button
              key={slot}
              initial={{ opacity: 0, x: 20 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: selectedSlot === slot ? 1.05 : 1,
              }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                selectedSlot === slot
                  ? "border-teal-300 bg-teal-50 text-teal-700 shadow-md shadow-teal-500/10"
                  : "border-slate-100 bg-white text-slate-600 hover:border-teal-200",
              )}
            >
              <span>{slot}</span>
              {selectedSlot === slot && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Check className="h-3 w-3 text-teal-600" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Confirmation Overlay */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <motion.div
                className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <Check className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Appointment Booked!
                </p>
                <p className="text-xs text-slate-500">
                  {selectedSlot} confirmed
                </p>
              </div>
              <motion.div
                className="flex items-center gap-1 text-[10px] text-emerald-600"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <CalendarIcon className="h-3 w-3" />
                <span>Synced to calendar</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================================
// Feature Card Components
// =============================================================================

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-teal-200/30 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 sm:p-8",
        // Glassmorphic background with teal gradient
        "bg-gradient-to-br from-white/80 via-teal-50/50 to-emerald-50/30",
        // Hover effects
        "hover:border-teal-300/50 hover:shadow-xl hover:shadow-teal-500/10",
        "hover:from-white/90 hover:via-teal-50/60 hover:to-emerald-50/40",
        // Animated gradient border effect
        "before:absolute before:inset-0 before:-z-10 before:rounded-2xl",
        "before:bg-gradient-to-br before:from-teal-400/0 before:via-teal-400/5 before:to-emerald-400/10",
        "before:opacity-0 before:transition-opacity before:duration-500",
        "hover:before:opacity-100",
        className,
      )}
    >
      {/* Subtle animated shimmer effect */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -inset-[100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,rgba(20,184,166,0.1)_50%,transparent_100%)]" />
      </div>
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <h3 className="font-display mb-2 text-left text-xl font-medium tracking-tight text-slate-900 md:text-2xl">
      {children}
    </h3>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="mb-4 max-w-sm text-left text-sm font-normal text-slate-600 md:text-base">
      {children}
    </p>
  );
};

// =============================================================================
// Features Data (SWAPPED: Discharge Calls now first, Voice Assistant now last)
// =============================================================================

const features = [
  {
    title: "Automated Discharge Follow-ups",
    description:
      "Every patient gets a next-day call. No staff time. No forgotten callbacks. 94% connection rate.",
    skeleton: <DischargeCallAnimation />,
    className: "col-span-1 border-b lg:col-span-4 lg:border-r",
  },
  {
    title: "Live Call Dashboard",
    description:
      "See calls as they happen. Track outcomes, sentiment, and appointments booked in real-time.",
    skeleton: <CallActivitySkeleton />,
    className: "col-span-1 border-b lg:col-span-2",
  },
  {
    title: "Syncs With Your PIMS",
    description:
      "Connects to IDEXX Neo, ezyVet, and Cornerstone. Patient data flows automatically.",
    skeleton: <PimsIntegrationSkeleton />,
    className: "col-span-1 lg:col-span-3 lg:border-r",
  },
  {
    title: "See Your ROI",
    description:
      "Track hours saved, appointments recovered, and dollar impact—updated daily.",
    skeleton: <AnalyticsSkeleton />,
    className: "col-span-1 border-b lg:col-span-3 lg:border-none",
  },
  {
    title: "Books Appointments Automatically",
    description:
      "Callers book directly during the call. Real-time calendar sync. No double-booking.",
    skeleton: <SchedulingSkeleton />,
    className: "col-span-1 lg:col-span-2 lg:border-r",
  },
  {
    title: "24/7 After-Hours Coverage",
    description:
      "The 11PM emergency question. The Sunday appointment request. Odis handles it all.",
    skeleton: <VoiceWaveSkeleton />,
    className: "col-span-1 lg:col-span-4",
  },
];

// =============================================================================
// Main Section Component
// =============================================================================

export function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative z-20 w-full overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32"
    >
      {/* Background */}
      <SectionBackground variant="hero-glow" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.1 }}
          className="mb-12 text-center lg:mb-16"
        >
          <motion.div
            variants={fadeUpVariant}
            className="mb-5 flex flex-wrap items-center justify-center gap-2"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/80 px-4 py-1.5 text-xs font-semibold tracking-widest text-teal-700 uppercase backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5" />
              Platform Features
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-600">
              <Shield className="h-3 w-3" />
              HIPAA Compliant
            </span>
          </motion.div>
          <motion.h2
            variants={fadeUpVariant}
            className="font-display mb-4 text-2xl font-medium tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl"
          >
            Two Ways Odis{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Saves You Hours
            </span>{" "}
            Every Week
          </motion.h2>
          <motion.p
            variants={fadeUpVariant}
            className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg"
          >
            Answer after-hours calls automatically. Follow up on every discharge without lifting a finger.
            See the impact in real-time.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <div className="relative">
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-6">
            {features.map((feature, idx) => (
              <BlurFade
                key={feature.title}
                delay={0.15 + idx * 0.1}
                inView
                inViewMargin="-50px"
                className={feature.className}
              >
                <FeatureCard>
                  <FeatureTitle>{feature.title}</FeatureTitle>
                  <FeatureDescription>{feature.description}</FeatureDescription>
                  <div className="flex-1">{feature.skeleton}</div>
                </FeatureCard>
              </BlurFade>
            ))}
          </div>
        </div>

        {/* Mini CTA */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.5 }}
          className="mt-12 flex justify-center lg:mt-16"
        >
          <Link
            href="#how-it-works"
            className="group inline-flex items-center gap-2 rounded-full bg-white/80 px-5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200/80 backdrop-blur-sm transition-all hover:bg-white hover:text-teal-700 hover:shadow-lg hover:ring-teal-300/50"
          >
            <span>See how it works</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
