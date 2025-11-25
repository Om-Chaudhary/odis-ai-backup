"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  MessageSquare,
  Mic,
  Phone,
  Check,
  Sparkles,
  Activity,
  Stethoscope,
} from "lucide-react";
import { useEffect, useState } from "react";

export function ProcessAnimation() {
  const [step, setStep] = useState(0);
  // Steps:
  // 0: Recording & Transcription
  // 1: Processing & Structuring
  // 2: Action & Delivery

  useEffect(() => {
    const sequence = async () => {
      while (true) {
        setStep(0);
        await new Promise((r) => setTimeout(r, 5000));
        setStep(1);
        await new Promise((r) => setTimeout(r, 4500));
        setStep(2);
        await new Promise((r) => setTimeout(r, 5000));
      }
    };
    void sequence();
  }, []);

  return (
    <div className="pointer-events-none relative flex min-h-[450px] w-full items-center justify-center py-8 select-none">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Central Microphone */}
            <div className="relative z-20 flex items-center justify-center">
              {/* Pulse Rings */}
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeOut",
                  }}
                  className="absolute h-32 w-32 rounded-full border border-teal-500/20 bg-teal-500/5"
                />
              ))}

              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-xl ring-4 shadow-teal-200/50 ring-white">
                <Mic className="h-10 w-10 text-white" />
              </div>
            </div>

            {/* Floating Transcript Bubbles */}
            <div className="absolute inset-0">
              <TranscriptBubble
                text="Patient presents with..."
                delay={0.5}
                x={-120}
                y={-80}
                rotate={-5}
              />
              <TranscriptBubble
                text="...left ear irritation"
                delay={1.5}
                x={130}
                y={-40}
                rotate={3}
              />
              <TranscriptBubble
                text="Examination shows..."
                delay={2.5}
                x={-100}
                y={60}
                rotate={-2}
              />
              <TranscriptBubble
                text="Prescribing Amoxicillin"
                delay={3.5}
                x={110}
                y={90}
                rotate={4}
              />
            </div>

            {/* Audio Waveform at bottom */}
            <div className="absolute bottom-12 flex h-12 items-center gap-1">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [10, Math.random() * 40 + 10, 10],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.05,
                    ease: "easeInOut",
                  }}
                  className="w-1.5 rounded-full bg-teal-400"
                />
              ))}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Document Transformation */}
            <div className="relative h-80 w-60 rounded-2xl border border-indigo-100 bg-white p-6 shadow-2xl ring-1 shadow-indigo-100/50 ring-slate-100">
              {/* Scanning Effect */}
              <motion.div
                initial={{ top: 0, opacity: 0 }}
                animate={{ top: "100%", opacity: [0, 1, 0] }}
                transition={{ duration: 2.5, ease: "linear" }}
                className="absolute right-0 left-0 z-10 h-1.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              />

              {/* Header */}
              <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 w-24 rounded-full bg-slate-200" />
                  <div className="h-2 w-16 rounded-full bg-slate-100" />
                </div>
              </div>

              {/* Content Lines */}
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.2 }}
                        className="h-2 w-2 rounded-full bg-indigo-200"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 0.5 + i * 0.2, duration: 0.5 }}
                        className="h-2 rounded-full bg-slate-100"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Extracted Data Cards Popping Out */}
              <ExtractedDataCard
                icon={<Stethoscope className="h-3 w-3" />}
                label="Diagnosis"
                value="Otitis Externa"
                color="text-indigo-600"
                bg="bg-indigo-50"
                border="border-indigo-100"
                delay={1.2}
                x={-50}
                y={-20}
              />
              <ExtractedDataCard
                icon={<Activity className="h-3 w-3" />}
                label="Weight"
                value="28 kg"
                color="text-rose-600"
                bg="bg-rose-50"
                border="border-rose-100"
                delay={1.5}
                x={50}
                y={40}
              />
              <ExtractedDataCard
                icon={<Sparkles className="h-3 w-3" />}
                label="Plan"
                value="Amoxicillin"
                color="text-emerald-600"
                bg="bg-emerald-50"
                border="border-emerald-100"
                delay={1.8}
                x={-30}
                y={100}
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="delivery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Central Hub */}
            <div className="relative mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
                className="relative z-20 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl ring-4 shadow-indigo-200 ring-white"
              >
                <Sparkles className="h-10 w-10 text-white" />
              </motion.div>

              {/* Connecting Lines */}
              <svg className="absolute top-1/2 left-1/2 h-[200px] w-[400px] -translate-x-1/2 -translate-y-1/2 overflow-visible">
                <motion.path
                  d="M 200 100 L 100 180"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeDasharray="10 10"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
                <motion.path
                  d="M 200 100 L 300 180"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeDasharray="10 10"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
                <motion.path
                  d="M 200 100 L 200 220"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeDasharray="10 10"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <DeliveryCard
                icon={<MessageSquare className="h-5 w-5" />}
                label="SMS"
                color="text-blue-600"
                bg="bg-blue-50"
                delay={0.5}
                delayCheck={1.5}
              />
              <DeliveryCard
                icon={<Phone className="h-5 w-5" />}
                label="Call"
                color="text-teal-600"
                bg="bg-teal-50"
                delay={0.7}
                delayCheck={1.7}
                isMain
              />
              <DeliveryCard
                icon={<FileText className="h-5 w-5" />}
                label="Documentation"
                color="text-purple-600"
                bg="bg-purple-50"
                delay={0.9}
                delayCheck={1.9}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TranscriptBubble({
  text,
  delay,
  x,
  y,
  rotate,
}: {
  text: string;
  delay: number;
  x: number;
  y: number;
  rotate: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
      animate={{ opacity: 1, scale: 1, x, y }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
      transition={{
        delay,
        type: "spring",
        damping: 20,
        stiffness: 100,
      }}
      className="absolute top-1/2 left-1/2 z-10 rounded-xl rounded-bl-none border border-slate-200 bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-slate-600 shadow-lg shadow-slate-100"
      style={{ rotate }}
    >
      {text}
    </motion.div>
  );
}

interface ExtractedDataCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
  border: string;
  delay: number;
  x: number;
  y: number;
}

function ExtractedDataCard({
  icon,
  label,
  value,
  color,
  bg,
  border,
  delay,
  x,
  y,
}: ExtractedDataCardProps) {
  return (
    <motion.div
      initial={{ scale: 0, x: 0, y: 0 }}
      animate={{ scale: 1, x, y }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
      className={`absolute top-1/2 left-1/2 z-20 flex items-center gap-2 rounded-lg border ${border} bg-white px-3 py-2 shadow-xl`}
    >
      <div className={`rounded-full ${bg} p-1 ${color}`}>{icon}</div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 uppercase">
          {label}
        </span>
        <span className="text-xs font-semibold whitespace-nowrap text-slate-700">
          {value}
        </span>
      </div>
    </motion.div>
  );
}

interface DeliveryCardProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
  delay: number;
  delayCheck: number;
  isMain?: boolean;
}

function DeliveryCard({
  icon,
  label,
  color,
  bg,
  delay,
  delayCheck,
  isMain,
}: DeliveryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring" }}
      className={`relative flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-4 shadow-lg ${isMain ? "z-10 scale-110 ring-2 ring-teal-100" : "scale-90 opacity-80"}`}
    >
      <div className={`mb-2 rounded-full ${bg} p-3 ${color}`}>{icon}</div>
      <span className="text-xs font-semibold text-slate-600">{label}</span>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delayCheck, type: "spring" }}
        className="absolute -top-1 -right-1 rounded-full bg-emerald-500 p-1 ring-2 ring-white"
      >
        <Check className="h-3 w-3 text-white" />
      </motion.div>
    </motion.div>
  );
}
