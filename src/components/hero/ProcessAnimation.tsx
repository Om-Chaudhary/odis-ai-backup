"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Mail,
  MessageSquare,
  Mic,
  Phone,
  Check,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

export function ProcessAnimation() {
  const [step, setStep] = useState(0);
  // Steps:
  // 0: Recording (Mic active)
  // 1: Processing (Lines appearing)
  // 2: Distribution (Email, Text, Call)

  useEffect(() => {
    const sequence = async () => {
      while (true) {
        setStep(0); // Start recording
        await new Promise((r) => setTimeout(r, 4000));
        setStep(1); // Processing
        await new Promise((r) => setTimeout(r, 4000));
        setStep(2); // Distribution
        await new Promise((r) => setTimeout(r, 5000));
      }
    };
    sequence();
  }, []);

  return (
    <div className="relative flex min-h-[450px] w-full items-center justify-center py-8 overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Expanding Pulse Rings */}
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
                className="absolute h-24 w-24 rounded-full border-2 border-rose-500/30"
              />
            ))}

            {/* Central Microphone */}
            <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-rose-50 to-rose-100 shadow-xl shadow-rose-200/50 ring-4 ring-white">
              <Mic className="h-14 w-14 text-rose-500" />
              
              {/* Inner Glow */}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-rose-500/10 blur-md"
              />
            </div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-col items-center gap-2"
            >
              <h3 className="text-xl font-semibold text-slate-900">Listening to Appointment</h3>
              <p className="text-sm text-slate-500">Capturing consult details in real-time...</p>
            </motion.div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
             {/* Document Container */}
             <div className="relative h-72 w-56 rounded-xl border border-indigo-100 bg-white p-6 shadow-xl shadow-indigo-100/50 ring-1 ring-slate-100">
                {/* Document Header */}
                <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-20 rounded-full bg-slate-200" />
                    <div className="h-1.5 w-12 rounded-full bg-slate-100" />
                  </div>
                </div>

                {/* Lines of Text */}
                <div className="space-y-3">
                   {[1, 2, 3, 4, 5, 6].map((i) => (
                     <motion.div
                       key={i}
                       initial={{ width: 0 }}
                       animate={{ width: "100%" }}
                       transition={{ delay: i * 0.1 + 0.5, duration: 0.5 }}
                       className="h-2 rounded-full bg-slate-100"
                     />
                   ))}
                </div>

                {/* Floating Keyword: Diagnosis */}
                <motion.div
                  initial={{ scale: 0, x: -20, y: 10 }}
                  animate={{ scale: 1, x: -40, y: -20 }}
                  transition={{ delay: 1.2, type: "spring" }}
                  className="absolute left-0 top-1/3 z-20 flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 shadow-lg shadow-indigo-100/50"
                >
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-xs font-medium text-indigo-900">Otitis Externa</span>
                </motion.div>

                {/* Floating Keyword: Vitals */}
                <motion.div
                  initial={{ scale: 0, x: 20, y: 0 }}
                  animate={{ scale: 1, x: 30, y: 40 }}
                  transition={{ delay: 1.5, type: "spring" }}
                  className="absolute right-0 top-1/2 z-20 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-2 shadow-lg shadow-amber-100/50"
                >
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-medium text-amber-900">Wt: 28kg</span>
                </motion.div>

                {/* Floating Keyword: Meds */}
                <motion.div
                  initial={{ scale: 0, x: 0, y: 20 }}
                  animate={{ scale: 1, x: -20, y: 100 }}
                  transition={{ delay: 1.8, type: "spring" }}
                  className="absolute bottom-20 left-4 z-20 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 shadow-lg shadow-emerald-100/50"
                >
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-emerald-900">Amoxicillin</span>
                </motion.div>

                {/* Scanning Beam */}
                <motion.div 
                  initial={{ top: 0, opacity: 0 }}
                  animate={{ top: "100%", opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent blur-sm"
                />
             </div>

             {/* Text */}
             <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-col items-center gap-2"
            >
              <h3 className="text-xl font-semibold text-slate-900">Extracting Clinical Data</h3>
              <p className="text-sm text-slate-500">Structuring key findings automatically...</p>
            </motion.div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="delivery"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="relative flex items-center justify-center">
               {/* Card 1: SMS (Left) */}
               <motion.div
                 initial={{ x: 0, y: 0, rotate: 0, scale: 0.9 }}
                 animate={{ x: -80, y: 10, rotate: -10, scale: 1 }}
                 transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                 className="absolute z-10 flex h-40 w-32 flex-col items-center justify-center rounded-xl border border-purple-100 bg-white shadow-lg shadow-purple-100/50 ring-1 ring-slate-100"
               >
                 <div className="mb-2 rounded-full bg-purple-50 p-3">
                   <MessageSquare className="h-6 w-6 text-purple-600" />
                 </div>
                 <span className="text-sm font-medium text-slate-600">SMS</span>
                 
                 <motion.div
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ delay: 1.2, type: "spring" }}
                   className="absolute -right-2 -top-2 rounded-full bg-emerald-100 p-1"
                 >
                   <Check className="h-3 w-3 text-emerald-600" />
                 </motion.div>
               </motion.div>

               {/* Card 2: Email (Right) */}
               <motion.div
                 initial={{ x: 0, y: 0, rotate: 0, scale: 0.9 }}
                 animate={{ x: 80, y: 10, rotate: 10, scale: 1 }}
                 transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                 className="absolute z-10 flex h-40 w-32 flex-col items-center justify-center rounded-xl border border-blue-100 bg-white shadow-lg shadow-blue-100/50 ring-1 ring-slate-100"
               >
                 <div className="mb-2 rounded-full bg-blue-50 p-3">
                   <Mail className="h-6 w-6 text-blue-600" />
                 </div>
                 <span className="text-sm font-medium text-slate-600">Email</span>

                 <motion.div
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ delay: 1.4, type: "spring" }}
                   className="absolute -right-2 -top-2 rounded-full bg-emerald-100 p-1"
                 >
                   <Check className="h-3 w-3 text-emerald-600" />
                 </motion.div>
               </motion.div>

               {/* Card 3: Call (Center, Front) */}
               <motion.div
                 initial={{ y: 0, scale: 0.9 }}
                 animate={{ y: -20, scale: 1.1 }}
                 transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
                 className="z-20 flex h-48 w-36 flex-col items-center justify-center rounded-xl border border-teal-100 bg-white shadow-xl shadow-teal-100/50 ring-1 ring-slate-100"
               >
                 <div className="mb-3 rounded-full bg-teal-50 p-4">
                   <Phone className="h-8 w-8 text-teal-600" />
                 </div>
                 <span className="font-medium text-slate-900">Follow-up Call</span>
                 <span className="text-xs text-slate-400">Automated Voice</span>

                 <motion.div
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ delay: 1.6, type: "spring" }}
                   className="absolute -right-2 -top-2 rounded-full bg-emerald-100 p-1.5"
                 >
                   <Check className="h-4 w-4 text-emerald-600" />
                 </motion.div>
               </motion.div>
            </div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex flex-col items-center gap-2"
            >
              <h3 className="text-xl font-semibold text-slate-900">Automated Client Follow-up</h3>
              <p className="text-sm text-slate-500">Delivered via their preferred channel.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

