"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@odis-ai/shared/ui/accordion";
import { BlurFade } from "~/components/landing/ui/blur-fade";
import { cn } from "@odis-ai/shared/util";

export interface AccordionFAQProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  className?: string;
}

export function AccordionFAQ({ faqs, className }: AccordionFAQProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className={cn("w-full space-y-3", className)}
    >
      {faqs.map((faq, index) => (
        <BlurFade key={index} delay={index * 0.1} inView>
          <AccordionItem
            value={`faq-${index}`}
            className="rounded-xl border border-slate-200 bg-white px-6 data-[state=open]:shadow-sm"
          >
            <AccordionTrigger className="text-left text-base font-medium text-slate-900 hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-slate-600">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        </BlurFade>
      ))}
    </Accordion>
  );
}
