"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import {
  MarketingLayout,
  PageHero,
  SectionContainer,
} from "~/components/marketing";
import { Button } from "@odis-ai/shared/ui/button";
import { Input } from "@odis-ai/shared/ui/input";
import { Textarea } from "@odis-ai/shared/ui/textarea";
import { Label } from "@odis-ai/shared/ui/label";

// TODO: Update contact information
const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@odis.ai",
    href: "mailto:hello@odis.ai",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "(925) 678-5640",
    href: "tel:+19256785640",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "", // TODO: Add location
    href: null,
  },
  {
    icon: Clock,
    label: "Hours",
    value: "", // TODO: Add business hours
    href: null,
  },
];

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ContactPage() {
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
    // TODO: Implement form submission
    console.log("Form submitted");
  };

  return (
    <MarketingLayout navbar={{ variant: "transparent" }}>
      {/* Hero Section */}
      <PageHero
        badge="Contact Us"
        title="Get in Touch"
        subtitle="" // TODO: Add subtitle
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="" // TODO: Add placeholder
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="" // TODO: Add placeholder
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="" // TODO: Add placeholder
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic Name</Label>
                <Input
                  id="clinicName"
                  name="clinicName"
                  placeholder="" // TODO: Add placeholder
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
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="" // TODO: Add placeholder
                  rows={4}
                  required
                />
              </div>

              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 w-full rounded-full py-3"
              >
                Send Message
              </Button>
            </form>
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
                {/* TODO: Add contact description */}
                Have questions? We&apos;d love to hear from you.
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
                          {item.value || "Coming soon"}
                        </a>
                      ) : (
                        <p className="text-slate-900">
                          {item.value || "Coming soon"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TODO: Add map or additional content */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-muted-foreground">
                {/* TODO: Add map embed or office image */}
                Map or additional content
              </p>
            </div>
          </motion.div>
        </div>
      </SectionContainer>
    </MarketingLayout>
  );
}
