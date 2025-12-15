"use client";

import { motion } from "framer-motion";
import { PhoneIncoming, PhoneOutgoing, Check } from "lucide-react";

export const UseCases = () => {
  const inboundCases = [
    "Appointment scheduling",
    "Prescription refill requests",
    "Hours & location questions",
    "New client intake",
    "After-hours answering",
  ];

  const outboundCases = [
    "Post-discharge follow-ups",
    "Appointment reminders",
    "Prescription ready notifications",
    "Recall reminders (vaccines, checkups)",
    "No-show re-engagement",
  ];

  return (
    <section id="features" className="bg-background w-full py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="text-primary mb-3 block text-xs font-medium tracking-widest uppercase">
            Capabilities
          </span>
          <h2 className="font-display text-foreground mb-4 text-3xl font-medium tracking-tight lg:text-4xl">
            What OdisAI Can Do
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl text-lg">
            Handle both inbound and outbound calls to save your team time
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Inbound Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-2xl p-8 lg:p-10"
          >
            <div className="mb-8 flex items-center gap-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <PhoneIncoming className="text-primary h-6 w-6" />
              </div>
              <div>
                <h3 className="text-foreground text-xl font-semibold">
                  Inbound Calls
                </h3>
                <p className="text-muted-foreground text-sm">
                  Answer every call instantly
                </p>
              </div>
            </div>
            <ul className="space-y-4">
              {inboundCases.map((useCase, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <span className="bg-primary/10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                    <Check className="text-primary h-3 w-3" />
                  </span>
                  <span className="text-foreground/80 text-base">
                    {useCase}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Outbound Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-card rounded-2xl p-8 lg:p-10"
          >
            <div className="mb-8 flex items-center gap-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <PhoneOutgoing className="text-primary h-6 w-6" />
              </div>
              <div>
                <h3 className="text-foreground text-xl font-semibold">
                  Outbound Calls
                </h3>
                <p className="text-muted-foreground text-sm">
                  Proactive patient outreach
                </p>
              </div>
            </div>
            <ul className="space-y-4">
              {outboundCases.map((useCase, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <span className="bg-primary/10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                    <Check className="text-primary h-3 w-3" />
                  </span>
                  <span className="text-foreground/80 text-base">
                    {useCase}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
