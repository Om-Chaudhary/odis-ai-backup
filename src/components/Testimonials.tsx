"use client";

import { useRef } from "react";
import { usePostHog } from "posthog-js/react";
import Image from "next/image";
import { useSectionVisibility } from "~/hooks/useSectionVisibility";
import { useDeviceDetection } from "~/hooks/useDeviceDetection";

export default function Testimonials() {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const sectionRef = useSectionVisibility("testimonials");
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTestimonialHover = (
    testimonial: { name: string; title: string },
    index: number,
  ) => {
    // Debounce hover events
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      posthog.capture("testimonial_card_hovered", {
        author: testimonial.name,
        role: testimonial.title,
        testimonial_index: index,
        device_type: deviceInfo.device_type,
      });
    }, 200);
  };

  const handleTestimonialLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };
  const testimonials = [
    {
      name: "Dr. Deepti Pal",
      title: "DVM",
      quote:
        "Odis is different from the other AI scribes I've tried—the diagnosis suggestions actually show up during the appointment, so most of the time I don't even need to touch the note afterward. That's been the biggest game changer for me.",
      image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiMxMDU5NjMiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxwYXRoIGQ9Ik0yMCAyMXYtMmE0IDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPgo8L3N2Zz4KPC9zdmc+",
    },
    {
      name: "Dr. Tais Perpetuo",
      title: "DVM",
      quote:
        "What I've really loved is that I walk into the room already knowing what I need to. The pre-appointment summaries are short and to the point—behavior notes, allergies, that kind of thing. It saves me time and honestly helps me connect with clients.",
      image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiMxMDU5NjMiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxwYXRoIGQ9Ik0yMCAyMXYtMmE0IDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPgo8L3N2Zz4KPC9zdmc+",
    },
    {
      name: "Jenn",
      title: "Practice Manager",
      quote:
        "One of the things clients notice right away is how fast they get follow-up instructions now. Before, they'd wait hours or we'd have to call them way later. Now it's all automated, and I think it makes us look way more organized and responsive.",
      image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiM2MzY2RjEiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxwYXRoIGQ9Ik0xNiA3YTQgNCAwIDAgMSA0IDR2MTBhNCA0IDAgMCAxLTQgNEg4YTQgNCAwIDAgMS00LTRWMTFhNCA0IDAgMCAxIDQtNGg4WiIvPgo8cGF0aCBkPSJNMTIgMTF2NCIvPgo8cGF0aCBkPSJtMTAgMTMgMi0yIDIgMiIvPgo8L3N2Zz4KPC9zdmc+",
    },
    {
      name: "Kayla",
      title: "Receptionist",
      quote:
        "From my side of things—I'm at the front a lot—it's just taken so much off our plate. Discharge instructions used to be this whole process at the end of every appointment. Now it's basically automatic.",
      image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiNGNTk0MTAiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxwYXRoIGQ9Ik0yMCAyMXYtMmE0IDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPgo8L3N2Zz4KPC9zdmc+",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="bg-gradient-to-b from-emerald-50/20 via-emerald-50/30 to-emerald-50/20 py-20 sm:py-24 md:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="font-display mb-16 text-center text-3xl font-bold text-gray-600 sm:mb-18 sm:text-4xl md:mb-20 md:text-5xl lg:text-6xl">
          Loved by Veterinarians
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              onMouseEnter={() => handleTestimonialHover(testimonial, index)}
              onMouseLeave={handleTestimonialLeave}
              className="bg-card border-border rounded-xl border p-6 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-8"
            >
              <Image
                src={testimonial.image || "/placeholder.svg"}
                alt={testimonial.name}
                width={80}
                height={80}
                className="mx-auto mb-4 h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20"
              />
              <p className="mb-4 font-serif text-sm leading-relaxed text-gray-700 sm:text-base">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="font-serif text-sm font-semibold text-gray-800 sm:text-base">
                {testimonial.name}
              </div>
              <div className="font-serif text-xs text-gray-700 sm:text-sm">
                {testimonial.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
