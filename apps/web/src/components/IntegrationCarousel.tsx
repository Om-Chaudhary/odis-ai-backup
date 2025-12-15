/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
type IntegrationApp = {
  name: string;
  logo: string;
};
type IntegrationCarouselProps = {
  buttonText?: string;
  buttonHref?: string;
  title?: string;
  subtitle?: string;
  topRowApps?: IntegrationApp[];
  bottomRowApps?: IntegrationApp[];
};
const defaultTopRowApps: IntegrationApp[] = [
  {
    name: "Integration 1",
    logo: "/images/logoipsum-389.png",
  },
  {
    name: "Integration 2",
    logo: "/images/logoipsum-407.png",
  },
  {
    name: "Integration 3",
    logo: "/images/logoipsum-379.png",
  },
  {
    name: "Integration 4",
    logo: "/images/logoipsum-374.png",
  },
  {
    name: "Integration 5",
    logo: "/images/logoipsum-381.png",
  },
  {
    name: "Integration 6",
    logo: "/images/logoipsum-401.png",
  },
  {
    name: "Integration 7",
    logo: "/images/logoipsum-403.png",
  },
  {
    name: "Integration 1",
    logo: "/images/logoipsum-389.png",
  },
  {
    name: "Integration 2",
    logo: "/images/logoipsum-407.png",
  },
  {
    name: "Integration 3",
    logo: "/images/logoipsum-379.png",
  },
  {
    name: "Integration 4",
    logo: "/images/logoipsum-374.png",
  },
  {
    name: "Integration 5",
    logo: "/images/logoipsum-381.png",
  },
];
const defaultBottomRowApps: IntegrationApp[] = [
  {
    name: "Integration 6",
    logo: "/images/logoipsum-401.png",
  },
  {
    name: "Integration 7",
    logo: "/images/logoipsum-403.png",
  },
  {
    name: "Integration 1",
    logo: "/images/logoipsum-389.png",
  },
  {
    name: "Integration 2",
    logo: "/images/logoipsum-407.png",
  },
  {
    name: "Integration 3",
    logo: "/images/logoipsum-379.png",
  },
  {
    name: "Integration 4",
    logo: "/images/logoipsum-374.png",
  },
  {
    name: "Integration 5",
    logo: "/images/logoipsum-381.png",
  },
  {
    name: "Integration 6",
    logo: "/images/logoipsum-401.png",
  },
  {
    name: "Integration 7",
    logo: "/images/logoipsum-403.png",
  },
  {
    name: "Integration 1",
    logo: "/images/logoipsum-389.png",
  },
  {
    name: "Integration 2",
    logo: "/images/logoipsum-407.png",
  },
  {
    name: "Integration 3",
    logo: "/images/logoipsum-379.png",
  },
];

// @component: IntegrationCarousel
export const IntegrationCarousel = ({
  buttonText = "See All Integrations",
  buttonHref = "#",
  title = "Connects with your practice management system.",
  subtitle = "OdisAI integrates with the tools you already use—so every call syncs seamlessly with your patient records.",
  topRowApps = defaultTopRowApps,
  bottomRowApps = defaultBottomRowApps,
}: IntegrationCarouselProps) => {
  const topRowRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let topAnimationId: number;
    let bottomAnimationId: number;
    let topPosition = 0;
    let bottomPosition = 0;
    const animateTopRow = () => {
      if (topRowRef.current) {
        topPosition -= 0.5;
        if (Math.abs(topPosition) >= topRowRef.current.scrollWidth / 2) {
          topPosition = 0;
        }
        topRowRef.current.style.transform = `translateX(${topPosition}px)`;
      }
      topAnimationId = requestAnimationFrame(animateTopRow);
    };
    const animateBottomRow = () => {
      if (bottomRowRef.current) {
        bottomPosition -= 0.65;
        if (Math.abs(bottomPosition) >= bottomRowRef.current.scrollWidth / 2) {
          bottomPosition = 0;
        }
        bottomRowRef.current.style.transform = `translateX(${bottomPosition}px)`;
      }
      bottomAnimationId = requestAnimationFrame(animateBottomRow);
    };
    topAnimationId = requestAnimationFrame(animateTopRow);
    bottomAnimationId = requestAnimationFrame(animateBottomRow);
    return () => {
      cancelAnimationFrame(topAnimationId);
      cancelAnimationFrame(bottomAnimationId);
    };
  }, []);

  // @return
  return (
    <div className="w-full bg-white py-24">
      <div className="mx-auto max-w-[680px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-20 flex flex-col items-center"
        >
          <div className="flex flex-col items-center gap-4">
            <h2 className="font-display text-foreground mb-0 text-center text-[40px] leading-tight font-medium tracking-tight">
              {title}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-[600px] text-center font-sans text-lg leading-7">
              {subtitle}
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            className="mt-6 flex gap-3"
          >
            <a
              href={buttonHref}
              className="inline-block w-[182px] cursor-pointer rounded-full bg-white px-5 py-2.5 text-center text-[15px] leading-6 font-medium whitespace-nowrap text-[#222222] transition-all duration-75 ease-out hover:shadow-lg"
              style={{
                boxShadow:
                  "0 -1px 0 0 rgb(181, 181, 181) inset, -1px 0 0 0 rgb(227, 227, 227) inset, 1px 0 0 0 rgb(227, 227, 227) inset, 0 1px 0 0 rgb(227, 227, 227) inset",
                backgroundImage:
                  "linear-gradient(rgba(255, 255, 255, 0.06) 80%, rgba(255, 255, 255, 0.12))",
              }}
            >
              {buttonText}
            </a>
          </motion.div>
        </motion.div>
      </div>

      <div className="relative -mt-6 mb-0 h-[268px] overflow-hidden pb-0">
        <div
          ref={topRowRef}
          className="absolute top-6 flex items-start gap-6 whitespace-nowrap"
          style={{
            willChange: "transform",
          }}
        >
          {[...topRowApps, ...topRowApps].map((app, index) => (
            <div
              key={`top-${index}`}
              className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-3xl"
              style={{
                backgroundImage:
                  "linear-gradient(rgb(255, 255, 255), rgb(252, 252, 252))",
                boxShadow:
                  "rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px, rgba(0, 0, 0, 0.04) 0px 3px 3px -1.4px, rgba(0, 0, 0, 0.04) 0px 6px 6px -3px, rgba(0, 0, 0, 0.04) 0px 12px 12px -6px, rgba(0, 0, 0, 0.04) 0px 12px 12px -12px",
              }}
            >
              <img
                src={app.logo || "/placeholder.svg"}
                alt={app.name}
                className="block h-9 w-9 object-contain"
              />
            </div>
          ))}
        </div>

        <div
          className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 h-[268px] w-60"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(0, 0, 0, 0), rgb(255, 255, 255))",
          }}
        />

        <div
          className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 h-[268px] w-60"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgb(255, 255, 255), rgba(0, 0, 0, 0))",
          }}
        />

        <div
          ref={bottomRowRef}
          className="absolute top-[148px] flex items-start gap-6 whitespace-nowrap"
          style={{
            willChange: "transform",
          }}
        >
          {[...bottomRowApps, ...bottomRowApps].map((app, index) => (
            <div
              key={`bottom-${index}`}
              className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-3xl"
              style={{
                backgroundImage:
                  "linear-gradient(rgb(255, 255, 255), rgb(252, 252, 252))",
                boxShadow:
                  "rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px, rgba(0, 0, 0, 0.04) 0px 3px 3px -1.4px, rgba(0, 0, 0, 0.04) 0px 6px 6px -3px, rgba(0, 0, 0, 0.04) 0px 12px 12px -6px, rgba(0, 0, 0, 0.04) 0px 12px 12px -12px",
              }}
            >
              <img
                src={app.logo || "/placeholder.svg"}
                alt={app.name}
                className="block h-9 w-9 object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
