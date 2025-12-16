"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneIncoming,
  PhoneOutgoing,
  Calendar,
  MessageSquare,
  Check,
  Bell,
  PawPrint,
} from "lucide-react";
import { useEffect, useState } from "react";

type FlowStep = "inbound" | "outbound";

interface NotificationCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  type: "inbound" | "outbound";
}

const notifications: NotificationCard[] = [
  {
    id: "1",
    title: "Appointment Booked",
    description: "Max's wellness exam - Tuesday 2pm",
    time: "Just now",
    icon: <Calendar className="h-4 w-4" />,
    type: "inbound",
  },
  {
    id: "2",
    title: "Follow-up Completed",
    description: "Luna's post-surgery check-in",
    time: "2 min ago",
    icon: <PhoneOutgoing className="h-4 w-4" />,
    type: "outbound",
  },
  {
    id: "3",
    title: "Question Answered",
    description: "Vaccination schedule for Bailey",
    time: "5 min ago",
    icon: <MessageSquare className="h-4 w-4" />,
    type: "inbound",
  },
];

export function CommunicationFlow() {
  const [activeStep, setActiveStep] = useState<FlowStep>("inbound");
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>(
    [],
  );

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev === "inbound" ? "outbound" : "inbound"));
    }, 4000);

    return () => clearInterval(stepInterval);
  }, []);

  useEffect(() => {
    // Stagger notification appearances
    const timers: NodeJS.Timeout[] = [];
    notifications.forEach((_, index) => {
      const timer = setTimeout(
        () => {
          setVisibleNotifications((prev) => [
            ...prev,
            notifications[index]?.id ?? "",
          ]);
        },
        800 * (index + 1),
      );
      timers.push(timer);
    });

    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* Warm background gradient */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-50/50 via-white to-teal-50/30" />

      {/* Decorative paw prints */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.08 }}
        transition={{ delay: 0.5 }}
        className="absolute inset-0 overflow-hidden rounded-3xl"
      >
        <PawPrint className="absolute top-8 right-12 h-16 w-16 rotate-12 text-[#31aba3]" />
        <PawPrint className="absolute bottom-16 left-8 h-12 w-12 -rotate-12 text-[#31aba3]" />
        <PawPrint className="absolute top-1/2 right-1/4 h-10 w-10 rotate-45 text-[#31aba3]" />
      </motion.div>

      {/* Main content */}
      <div className="relative flex h-full flex-col items-center justify-center p-8">
        {/* Central AI Hub */}
        <div className="relative mb-8">
          {/* Animated ring */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -inset-4 rounded-full bg-[#31aba3]/20"
          />

          {/* Hub icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#31aba3] to-[#2da096] shadow-lg shadow-[#31aba3]/30"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-2xl border-2 border-dashed border-white/20"
            />
            <span className="text-2xl font-bold text-white">AI</span>
          </motion.div>
        </div>

        {/* Communication Flow Indicators */}
        <div className="mb-8 flex items-center gap-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3"
            >
              {activeStep === "inbound" ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <PhoneIncoming className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800">
                      Inbound Call
                    </p>
                    <p className="text-xs text-slate-500">
                      Answering & booking appointments
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <PhoneOutgoing className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800">
                      Outbound Call
                    </p>
                    <p className="text-xs text-slate-500">
                      Follow-ups & reminders
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Flow indicator dots */}
        <div className="mb-6 flex gap-2">
          <motion.div
            animate={{
              backgroundColor: activeStep === "inbound" ? "#3b82f6" : "#cbd5e1",
            }}
            className="h-2 w-2 rounded-full"
          />
          <motion.div
            animate={{
              backgroundColor:
                activeStep === "outbound" ? "#10b981" : "#cbd5e1",
            }}
            className="h-2 w-2 rounded-full"
          />
        </div>

        {/* Notification Stack */}
        <div className="w-full max-w-sm space-y-3">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={
                visibleNotifications.includes(notification.id)
                  ? { opacity: 1, x: 0, scale: 1 }
                  : {}
              }
              transition={{ type: "spring", damping: 20 }}
              className={`relative overflow-hidden rounded-xl border bg-white/90 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 ${
                (activeStep === "inbound" && notification.type === "inbound") ||
                (activeStep === "outbound" && notification.type === "outbound")
                  ? "border-[#31aba3]/30 shadow-md shadow-[#31aba3]/10"
                  : "border-slate-200/60"
              }`}
            >
              {/* Active indicator */}
              {((activeStep === "inbound" && notification.type === "inbound") ||
                (activeStep === "outbound" &&
                  notification.type === "outbound")) && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute top-0 left-0 h-full w-1 bg-[#31aba3]"
                />
              )}

              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    notification.type === "inbound"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  {notification.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">
                      {notification.title}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <Check className="h-3 w-3" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {notification.description}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {notification.time}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* "Live" indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-slate-600">
            Live Activity
          </span>
        </motion.div>
      </div>
    </div>
  );
}
