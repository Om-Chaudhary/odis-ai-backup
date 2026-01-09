"use client";

import { useRef, useActionState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Mail, MapPin, Clock, CheckCircle, Loader2 } from "lucide-react";
import {
  MarketingLayout,
  PageHero,
  SectionContainer,
} from "~/components/marketing";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import { Textarea } from "@odis-ai/shared/ui/textarea";
import { Label } from "@odis-ai/shared/ui/label";
import {
  submitContactForm,
  type ContactFormState,
} from "~/server/actions/contact";

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@odis.ai",
    href: "mailto:hello@odis.ai",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "San Francisco Bay Area, CA",
    href: null,
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon-Fri: 9am - 6pm PST",
    href: null,
  },
];

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ContactContent() {
  const formRef = useRef<HTMLDivElement>(null);
  const isFormInView = useInView(formRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const [state, formAction, isPending] = useActionState<
    ContactFormState | null,
    FormData
  >(submitContactForm, null);

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <MarketingLayout navbar={{ variant: "transparent" }}>
      {/* Hero Section */}
      <PageHero
        badge="Contact Us"
        title="Get in Touch"
        subtitle="Have questions about OdisAI? We'd love to hear from you. Send us a message and we'll respond as soon as possible."
        backgroundVariant="hero-glow"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Contact", href: "/contact" },
        ]}
      />

      {/* Contact Section */}
      <SectionContainer backgroundVariant="cool-blue" padding="default">
        <div ref={formRef} className="grid gap-12 lg:grid-cols-2">
          {/* Contact Form */}
          <motion.div
            initial="hidden"
            animate={isFormInView ? "visible" : "hidden"}
            variants={fadeUpVariant}
            transition={transition}
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h2 className="font-display mb-6 text-2xl font-semibold text-slate-900">
              Send us a message
            </h2>

            {state?.success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                  <CheckCircle className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  Message Sent!
                </h3>
                <p className="text-slate-600">{state.message}</p>
              </motion.div>
            ) : (
              <form action={formAction} className="space-y-6">
                {state?.message && !state.success && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {state.message}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      required
                      aria-invalid={!!state?.errors?.firstName}
                    />
                    {state?.errors?.firstName && (
                      <p className="text-sm text-red-500">
                        {state.errors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      required
                      aria-invalid={!!state?.errors?.lastName}
                    />
                    {state?.errors?.lastName && (
                      <p className="text-sm text-red-500">
                        {state.errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    required
                    aria-invalid={!!state?.errors?.email}
                  />
                  {state?.errors?.email && (
                    <p className="text-sm text-red-500">{state.errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic Name (optional)</Label>
                  <Input
                    id="clinicName"
                    name="clinicName"
                    placeholder="ABC Veterinary Clinic"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us how we can help..."
                    rows={4}
                    required
                    aria-invalid={!!state?.errors?.message}
                  />
                  {state?.errors?.message && (
                    <p className="text-sm text-red-500">
                      {state.errors.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/90 w-full rounded-full py-3"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </form>
            )}
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial="hidden"
            animate={isFormInView ? "visible" : "hidden"}
            variants={fadeUpVariant}
            transition={{ ...transition, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h2 className="font-display mb-4 text-2xl font-semibold text-slate-900">
                Contact Information
              </h2>
              <p className="text-muted-foreground">
                Have questions? We&apos;d love to hear from you. Reach out to us
                through any of the channels below.
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-slate-900 transition-colors hover:text-teal-600"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-slate-900">{item.value}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional info */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="mb-2 font-semibold text-slate-900">
                Prefer to schedule a call?
              </h3>
              <p className="mb-4 text-sm text-slate-600">
                Book a free demo to see OdisAI in action and discuss how we can
                help your veterinary practice.
              </p>
              <a
                href="/demo"
                className="inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                Schedule a Demo →
              </a>
            </div>
          </motion.div>
        </div>
      </SectionContainer>
    </MarketingLayout>
  );
}
