"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Zap,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { BentoCard, BentoGrid } from "~/components/ui/bento-grid";
import { AnimatedList, AnimatedListItem } from "~/components/ui/animated-list";
import { SectionBackground } from "~/components/ui/section-background";

// Animation variants - consistent with hero
const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const notifications = [
  {
    name: "Appointment booked",
    description: "Rex's annual checkup scheduled for Tuesday",
    time: "2m ago",
  },
  {
    name: "Question answered",
    description: "Provided clinic hours and location",
    time: "5m ago",
  },
  {
    name: "Follow-up completed",
    description: "Post-surgery check-in with Luna's owner",
    time: "8m ago",
  },
];

export const UseCases = () => {
  const features = [
    {
      Icon: PhoneIncoming,
      name: "24/7 Inbound Calls",
      description: "Answer every call instantly, any time of day or night.",
      href: "#",
      cta: "Learn more",
      className: "col-span-3 lg:col-span-1",
      background: (
        <div className="absolute top-0 right-0 h-full w-full opacity-60">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31aba3]/20 to-transparent" />
          <div className="absolute top-8 right-8 h-32 w-32 rounded-full bg-[#31aba3]/10 blur-2xl" />
        </div>
      ),
    },
    {
      Icon: PhoneOutgoing,
      name: "Automated Outbound",
      description:
        "Proactive follow-ups, reminders, and recalls—automatically.",
      href: "#",
      cta: "Learn more",
      className: "col-span-3 lg:col-span-2",
      background: (
        <AnimatedList className="absolute top-4 right-2 h-[300px] w-full max-w-[300px] border-none [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] transition-all duration-300 ease-out group-hover:scale-105">
          {notifications.map((item, idx) => (
            <AnimatedListItem key={idx}>
              <div className="glass-card rounded-lg p-3 text-sm">
                <div className="text-foreground font-semibold">{item.name}</div>
                <div className="text-muted-foreground text-xs">
                  {item.description}
                </div>
                <div className="mt-1 text-xs text-[#31aba3]">{item.time}</div>
              </div>
            </AnimatedListItem>
          ))}
        </AnimatedList>
      ),
    },
    {
      Icon: Calendar,
      name: "Appointment Booking",
      description: "Direct integration with your PIMS for seamless scheduling.",
      className: "col-span-3 lg:col-span-2",
      href: "#",
      cta: "Learn more",
      background: (
        <div className="absolute top-0 right-0 h-full w-full">
          <div className="glass-card absolute top-4 right-4 max-w-xs rounded-xl p-4">
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#31aba3]" />
              <span className="text-sm font-semibold">New Appointment</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-medium">Max (Dog)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-medium">Wellness Exam</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">Tomorrow, 2:30 PM</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      Icon: Clock,
      name: "After-Hours Coverage",
      description: "Never miss a call, even when your clinic is closed.",
      className: "col-span-3 lg:col-span-1",
      href: "#",
      cta: "Learn more",
      background: (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="glass-card rounded-full p-6">
            <Clock className="h-12 w-12 text-[#31aba3]" />
          </div>
        </div>
      ),
    },
    {
      Icon: Zap,
      name: "Instant Responses",
      description:
        "Answer common questions about services, hours, and pricing.",
      className: "col-span-3 lg:col-span-1",
      href: "#",
      cta: "Learn more",
      background: (
        <div className="absolute top-0 right-0 h-full w-full">
          <div className="absolute inset-0 bg-gradient-to-tl from-[#31aba3]/10 to-transparent" />
        </div>
      ),
    },
    {
      Icon: MessageSquare,
      name: "Natural Conversations",
      description: "AI that sounds human and understands context.",
      className: "col-span-3 lg:col-span-2",
      href: "#",
      cta: "Learn more",
      background: (
        <div className="absolute top-4 right-4 max-w-sm">
          <div className="glass-card space-y-2 rounded-xl p-4 text-xs">
            <div className="rounded-lg bg-[#31aba3]/10 p-2 text-[#31aba3]">
              <strong>Caller:</strong> Do you have appointments available this
              week?
            </div>
            <div className="bg-foreground/5 rounded-lg p-2">
              <strong>OdisAI:</strong> Yes! I have openings on Wednesday at 2 PM
              and Friday at 10 AM. Which works better for you?
            </div>
          </div>
        </div>
      ),
    },
  ];

  const sectionRef = useRef<HTMLElement>(null);
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
      className="relative w-full overflow-hidden py-24 lg:py-32"
    >
      {/* Cohesive background */}
      <SectionBackground variant="subtle-cool" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.15 }}
          className="mb-12 text-center lg:mb-16"
        >
          <span className="font-display text-primary mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
            <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
            Capabilities
          </span>
          <h2 className="font-display text-foreground mb-4 text-4xl font-medium tracking-tight lg:text-5xl">
            Everything Your Clinic Needs
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Handle both inbound and outbound calls with AI that sounds natural
            and integrates seamlessly
          </p>
        </motion.div>

        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ ...transition, delay: 0.25 }}
        >
          <BentoGrid className="auto-rows-[200px]">
            {features.map((feature, idx) => (
              <BentoCard key={idx} {...feature} />
            ))}
          </BentoGrid>
        </motion.div>
      </div>
    </section>
  );
};
