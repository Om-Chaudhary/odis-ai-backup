"use client";

import { useState, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { ChevronDownIcon, HelpCircleIcon } from "lucide-react";
import { FloatingElements } from "@odis-ai/shared/ui/floating-elements";
import { ParticleBackground } from "@odis-ai/shared/ui/particle-background";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";

const faqData = [
  {
    question: "What is OdisAI and how does it work?",
    answer:
      "OdisAI is an intelligent veterinary practice management system that uses artificial intelligence to streamline your clinic operations. It integrates with your existing practice management software to provide automated data entry, intelligent insights, and enhanced workflow efficiency.",
  },
  {
    question: "Which practice management systems do you support?",
    answer:
      "We currently support integration with major veterinary practice management systems including Avimark, Cornerstone, ezyVet, Digitail, Vetspire, and IDEXX Neo. Our team is continuously working to add support for additional systems.",
  },
  {
    question: "How secure is my practice data?",
    answer:
      "Data security is our top priority. We are HIPAA and SOC 2 adjacent, using enterprise-grade encryption and maintaining the highest security standards. Your data is encrypted both in transit and at rest, and we never share your information with third parties without explicit consent.",
  },
  {
    question: "What kind of setup and training is required?",
    answer:
      "Our implementation process is designed to be seamless and non-disruptive. We provide comprehensive training for your team, including live sessions and documentation. Most practices are up and running within a few days with minimal downtime.",
  },
  {
    question: "Do you offer customer support?",
    answer:
      "Yes! We provide 24/7 customer support via phone, email, and chat. Our dedicated support team includes veterinary professionals who understand the unique challenges of running a veterinary practice.",
  },
  {
    question: "Can I try OdisAI before committing?",
    answer:
      "Absolutely! Contact our team to discuss how you can experience the benefits of OdisAI in your own practice. We'll work with you to set up a pilot program and demonstrate the value before you make any long-term commitment.",
  },
  {
    question: "How does OdisAI improve my practice efficiency?",
    answer:
      "OdisAI automates routine tasks like data entry, appointment scheduling, and report generation. It reduces administrative burden by up to 70%, allowing your team to focus on what matters most - providing excellent care to your patients and clients.",
  },
];

export default function FAQ() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleItem = (index: number) => {
    const itemId = `item-${index}`;
    setOpenItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );

    // Track FAQ interaction
    posthog?.capture?.("faq_item_toggled", {
      question: faqData[index]?.question,
      is_opening: !openItems.includes(itemId),
      device_type: deviceInfo.device_type,
    });
  };

  const handleItemHover = (index: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      posthog?.capture?.("faq_item_hovered", {
        question: faqData[index]?.question,
        device_type: deviceInfo.device_type,
      });
    }, 200);
  };

  const handleItemLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/20 via-emerald-50/30 to-emerald-50/20 py-20 sm:py-24 md:py-28 lg:py-32">
      {/* Animated background elements */}
      <ParticleBackground
        className="opacity-5"
        particleCount={6}
        color="#31aba3"
        size={2}
      />
      <FloatingElements
        className="opacity-10"
        count={2}
        size="sm"
        color="#31aba3"
      />

      {/* Subtle background elements */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute top-20 left-20 h-12 w-12 animate-pulse rounded-full bg-[#31aba3]/20"></div>
        <div className="absolute top-40 right-32 h-8 w-8 animate-pulse rounded-full bg-[#31aba3]/20 delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 h-6 w-6 animate-pulse rounded-full bg-[#31aba3]/20 delay-500"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-[#31aba3]/10 px-4 py-2">
            <HelpCircleIcon className="mr-2 h-5 w-5 text-[#31aba3]" />
            <span className="text-sm font-semibold text-[#31aba3]">FAQ</span>
          </div>
          <h2 className="font-display mb-6 text-3xl font-bold text-gray-600 sm:text-4xl md:text-5xl lg:text-6xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto max-w-3xl font-serif text-lg leading-relaxed text-gray-700 sm:text-xl">
            Get answers to common questions about OdisAI and how it can
            transform your veterinary practice.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="mx-auto max-w-4xl">
          <div className="space-y-4">
            {faqData.map((faq, index) => {
              const isOpen = openItems.includes(`item-${index}`);
              return (
                <div
                  key={index}
                  onMouseEnter={() => handleItemHover(index)}
                  onMouseLeave={handleItemLeave}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                  style={{
                    boxShadow: isOpen
                      ? "0 4px 15px rgba(0, 0, 0, 0.08), 0 8px 30px rgba(0, 0, 0, 0.04)"
                      : "0 2px 10px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  {/* Card background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-emerald-50/10"></div>

                  {/* Content */}
                  <div className="relative z-10 p-6 sm:p-8">
                    <button
                      onClick={() => toggleItem(index)}
                      className="w-full rounded-lg text-left focus:ring-2 focus:ring-[#31aba3]/20 focus:ring-offset-2 focus:outline-none"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="font-display pr-4 text-lg font-semibold text-gray-800 transition-colors duration-200 group-hover:text-[#31aba3] sm:text-xl">
                          {faq.question}
                        </h3>
                        <div className="flex-shrink-0">
                          <ChevronDownIcon
                            className={`h-5 w-5 text-[#31aba3] transition-transform duration-300 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>
                    </button>

                    {/* Answer */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen
                          ? "mt-4 max-h-96 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="border-t border-gray-200/50 pt-4">
                        <p className="font-serif leading-relaxed text-gray-700">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#31aba3]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
