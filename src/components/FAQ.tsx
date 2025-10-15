"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

const faqData = [
  {
    question: "What is ODIS AI and how does it work?",
    answer:
      "ODIS AI is an intelligent veterinary practice management system that uses artificial intelligence to streamline your clinic operations. It integrates with your existing practice management software to provide automated data entry, intelligent insights, and enhanced workflow efficiency.",
  },
  {
    question: "Which practice management systems do you support?",
    answer:
      "We currently support integration with major veterinary practice management systems including Avimark, Cornerstone, ezyVet, Digitail, Vetspire, and IDEXX Neo. Our team is continuously working to add support for additional systems.",
  },
  {
    question: "How secure is my practice data?",
    answer:
      "Data security is our top priority. We use enterprise-grade encryption, comply with HIPAA regulations, and maintain SOC 2 Type II certification. Your data is encrypted both in transit and at rest, and we never share your information with third parties without explicit consent.",
  },
  {
    question: "What kind of setup and training is required?",
    answer:
      "Our implementation process is designed to be seamless and non-disruptive. We provide comprehensive training for your team, including live sessions and documentation. Most practices are up and running within 2-4 weeks with minimal downtime.",
  },
  {
    question: "How much does ODIS AI cost?",
    answer:
      "Our pricing is based on the size of your practice and the features you need. We offer flexible plans that scale with your business. Contact our sales team for a personalized quote that fits your practice's specific requirements.",
  },
  {
    question: "Do you offer customer support?",
    answer:
      "Yes! We provide 24/7 customer support via phone, email, and chat. Our dedicated support team includes veterinary professionals who understand the unique challenges of running a veterinary practice.",
  },
  {
    question: "Can I try ODIS AI before committing?",
    answer:
      "Absolutely! We offer a free trial period so you can experience the benefits of ODIS AI in your own practice. Our team will work with you to set up a pilot program and demonstrate the value before you make any long-term commitment.",
  },
  {
    question: "How does ODIS AI improve my practice efficiency?",
    answer:
      "ODIS AI automates routine tasks like data entry, appointment scheduling, and report generation. It reduces administrative burden by up to 70%, allowing your team to focus on what matters most - providing excellent care to your patients and clients.",
  },
];

export default function FAQ() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Get answers to common questions about ODIS AI and how it can
            transform your veterinary practice.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqData.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-b border-gray-200"
            >
              <AccordionTrigger className="py-6 text-left text-lg font-semibold text-gray-900 transition-colors hover:text-blue-600">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-6 leading-relaxed text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
