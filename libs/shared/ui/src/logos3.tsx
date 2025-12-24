// This template requires the Embla Auto Scroll plugin to be installed:
//
// npm install embla-carousel-auto-scroll

"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import Image from "next/image";
import AutoScroll from "embla-carousel-auto-scroll";

import { Carousel, CarouselContent, CarouselItem } from "./carousel";

type DeviceInfo = {
  device_type: "mobile" | "tablet" | "desktop";
  viewport_width: number;
  viewport_height: number;
};

function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    device_type: "desktop",
    viewport_width: 1024,
    viewport_height: 768,
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      let device_type: DeviceInfo["device_type"];
      if (width < 768) {
        device_type = "mobile";
      } else if (width <= 1024) {
        device_type = "tablet";
      } else {
        device_type = "desktop";
      }

      setDeviceInfo({
        device_type,
        viewport_width: width,
        viewport_height: height,
      });
    };

    updateDeviceInfo();
    window.addEventListener("resize", updateDeviceInfo);
    return () => window.removeEventListener("resize", updateDeviceInfo);
  }, []);

  return deviceInfo;
}

function useSectionVisibility(sectionName: string, threshold = 0.5) {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasBeenViewed = useRef(false);
  const viewStartTime = useRef<number | null>(null);
  const pageLoadTime = useRef(Date.now());

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenViewed.current) {
            hasBeenViewed.current = true;
            viewStartTime.current = Date.now();
            posthog.capture("section_viewed", {
              section_name: sectionName,
              time_to_view: Date.now() - pageLoadTime.current,
              device_type: deviceInfo.device_type,
              viewport_width: deviceInfo.viewport_width,
              viewport_height: deviceInfo.viewport_height,
            });
          } else if (
            !entry.isIntersecting &&
            hasBeenViewed.current &&
            viewStartTime.current
          ) {
            const timeSpent = Date.now() - viewStartTime.current;
            posthog.capture("section_engagement", {
              section_name: sectionName,
              time_spent: timeSpent,
              device_type: deviceInfo.device_type,
            });
            viewStartTime.current = null;
          }
        });
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [sectionName, threshold, posthog, deviceInfo]);

  return sectionRef;
}

interface Logo {
  id: string;
  description: string;
  image: string;
  className?: string;
}

interface Logos3Props {
  heading?: string;
  logos?: Logo[];
  className?: string;
}

const Logos3 = ({
  heading = "Trusted by Veterinary Practices & Integrated with Leading Systems",
  logos = [
    {
      id: "logo-1",
      description: "AVImark",
      image: "/logos/avimark.png",
      className: "h-12 w-auto max-w-[120px]",
    },
    {
      id: "logo-2",
      description: "Vetspire",
      image: "/logos/vetspire.png",
      className: "h-12 w-auto max-w-[120px]",
    },
    {
      id: "logo-3",
      description: "ezyVet",
      image: "/logos/ezyvet.png",
      className: "h-12 w-auto max-w-[120px]",
    },
    {
      id: "logo-4",
      description: "IDEXX Neo",
      image: "/logos/idexx-neo.svg",
      className: "h-12 w-auto max-w-[120px]",
    },
    {
      id: "logo-5",
      description: "IDEXX Cornerstone",
      image: "/logos/idexx-cornerstone.png",
      className: "h-12 w-auto max-w-[120px]",
    },
    {
      id: "logo-6",
      description: "Digitail",
      image: "/logos/digitail.png",
      className: "h-12 w-auto max-w-[120px]",
    },
  ],
}: Logos3Props) => {
  const posthog = usePostHog();
  const deviceInfo = useDeviceDetection();
  const sectionRef = useSectionVisibility("trust_logos");
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Duplicate logos for seamless loop
  const duplicatedLogos = [...logos, ...logos, ...logos];

  const handleLogoHover = (logo: Logo, index: number) => {
    // Debounce hover events
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      posthog.capture("trust_logo_hovered", {
        logo_name: logo.description,
        logo_index: index,
        device_type: deviceInfo.device_type,
      });
    }, 200);
  };

  const handleLogoLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden bg-gradient-to-b from-emerald-50/20 via-emerald-50/30 to-emerald-50/20 py-20 sm:py-24 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="font-display mb-16 text-center text-2xl font-bold text-gray-600 sm:text-3xl md:text-4xl lg:text-5xl">
          {heading}
        </h2>
        <div className="relative w-full">
          <Carousel
            opts={{
              loop: true,
              align: "start",
              dragFree: true,
            }}
            plugins={[
              AutoScroll({
                playOnInit: true,
                speed: 1,
                stopOnInteraction: false,
                stopOnMouseEnter: false,
                stopOnFocusIn: false,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="ml-0">
              {duplicatedLogos.map((logo, index) => (
                <CarouselItem
                  key={`${logo.id}-${index}`}
                  className="flex min-w-[200px] basis-auto justify-center pl-0"
                >
                  <div
                    className="flex shrink-0 items-center justify-center px-8"
                    onMouseEnter={() => handleLogoHover(logo, index)}
                    onMouseLeave={handleLogoLeave}
                  >
                    <Image
                      src={logo.image}
                      alt={logo.description}
                      width={120}
                      height={48}
                      className={`${logo.className} opacity-60 grayscale filter transition-opacity hover:opacity-100`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-emerald-50/20 to-transparent"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-emerald-50/20 to-transparent"></div>
        </div>
      </div>
    </section>
  );
};

export { Logos3 };
