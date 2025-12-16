"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Phone, Calendar, Clock, Star } from "lucide-react";
import {
  MarketingLayout,
  PageHero,
  SectionContainer,
} from "~/components/marketing";
import { Button } from "@odis-ai/ui/button";
import { Input } from "@odis-ai/ui/input";
import { Label } from "@odis-ai/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/ui/select";

// TODO: Update expectations list
const whatToExpect = [
  {
    icon: Phone,
    title: "Live Demo Call",
    description: "", // TODO: Add description
  },
  {
    icon: Calendar,
    title: "Personalized Walkthrough",
    description: "", // TODO: Add description
  },
  {
    icon: Clock,
    title: "30-Minute Session",
    description: "", // TODO: Add description
  },
];

// TODO: Add testimonial data
const testimonial = {
  quote: "", // TODO: Add quote
  author: "", // TODO: Add author name
  role: "", // TODO: Add role
  clinic: "", // TODO: Add clinic name
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function DemoPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const isFormInView = useInView(formRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.6,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  // TODO: Add form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission / calendar booking
    console.log("Demo form submitted");
  };

  return (
    <MarketingLayout navbar={{ variant: "transparent" }}>
      {/* Hero Section */}
      <PageHero
        badge="Book a Demo"
        title="See OdisAI in Action"
        subtitle="" // TODO: Add subtitle
        backgroundVariant="hero-glow"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Book a Demo", href: "/demo" },
        ]}
      />

      {/* Demo Request Section */}
      <SectionContainer backgroundVariant="cool-blue" padding="large">
        <div ref={formRef} className="grid gap-12 lg:grid-cols-2">
          {/* Demo Form */}
          <motion.div
            initial="hidden"
            animate={isFormInView ? "visible" : "hidden"}
            variants={fadeUpVariant}
            transition={transition}
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h2 className="font-display mb-2 text-2xl font-semibold text-slate-900">
              Request a Demo
            </h2>
            <p className="text-muted-foreground mb-6">
              {/* TODO: Add form description */}
              Fill out the form below and we&apos;ll be in touch within 24
              hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="" // TODO: Add placeholder
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="" // TODO: Add placeholder
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="" // TODO: Add placeholder
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic Name *</Label>
                <Input
                  id="clinicName"
                  name="clinicName"
                  placeholder="" // TODO: Add placeholder
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="" // TODO: Add placeholder
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicSize">Clinic Size</Label>
                <Select name="clinicSize">
                  <SelectTrigger>
                    <SelectValue placeholder="Select clinic size" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* TODO: Add clinic size options */}
                    <SelectItem value="1-5">1-5 staff</SelectItem>
                    <SelectItem value="6-15">6-15 staff</SelectItem>
                    <SelectItem value="16-30">16-30 staff</SelectItem>
                    <SelectItem value="30+">30+ staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pims">Current PIMS</Label>
                <Select name="pims">
                  <SelectTrigger>
                    <SelectValue placeholder="Select your PIMS" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* TODO: Add PIMS options based on integrations */}
                    <SelectItem value="idexx-neo">IDEXX Neo</SelectItem>
                    <SelectItem value="ezyvet">ezyVet</SelectItem>
                    <SelectItem value="cornerstone">Cornerstone</SelectItem>
                    <SelectItem value="avimark">AVImark</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 w-full rounded-full py-3"
              >
                Request Demo
              </Button>

              <p className="text-muted-foreground text-center text-xs">
                {/* TODO: Add privacy note */}
                By submitting this form, you agree to our Privacy Policy.
              </p>
            </form>
          </motion.div>

          {/* What to Expect */}
          <motion.div
            initial="hidden"
            animate={isFormInView ? "visible" : "hidden"}
            variants={fadeUpVariant}
            transition={{ ...transition, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h2 className="font-display mb-4 text-2xl font-semibold text-slate-900">
                What to Expect
              </h2>
              <p className="text-muted-foreground">
                {/* TODO: Add description */}
                Get a personalized walkthrough of OdisAI tailored to your
                clinic&apos;s needs.
              </p>
            </div>

            <div className="space-y-6">
              {whatToExpect.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial="hidden"
                    animate={isFormInView ? "visible" : "hidden"}
                    variants={fadeUpVariant}
                    transition={{ ...transition, delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {item.description || "Description coming soon"}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Demo Option */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-teal-600" />
                <h3 className="font-medium text-slate-900">
                  Want to try it now?
                </h3>
              </div>
              <p className="text-muted-foreground mb-4 text-sm">
                {/* TODO: Add call demo description */}
                Call our demo line to experience OdisAI immediately.
              </p>
              <a
                href="tel:+19256785640"
                className="inline-flex items-center gap-2 font-semibold text-teal-600 transition-colors hover:text-teal-700"
              >
                <Phone className="h-4 w-4" />
                (925) 678-5640
              </a>
            </div>

            {/* Testimonial */}
            {testimonial.quote && (
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-3 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <blockquote className="mb-4 text-slate-700">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div>
                  <p className="font-medium text-slate-900">
                    {testimonial.author}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {testimonial.role}, {testimonial.clinic}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </SectionContainer>
    </MarketingLayout>
  );
}
