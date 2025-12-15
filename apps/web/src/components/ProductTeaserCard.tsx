"use client";
import { motion } from "framer-motion";
import { Play, ArrowRight } from "lucide-react";
import Image from "next/image";

type ProductTeaserCardProps = {
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  imageSrc?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
};

export const ProductTeaserCard = (props: ProductTeaserCardProps) => {
  const {
    eyebrow = "BUILT FOR VETERINARY PRACTICES",
    headline = "Never Miss Another Call. Never Forget a Follow-Up.",
    subheadline = "OdisAI handles your clinic's inbound and outbound calls with AI voice agents that sound natural, book appointments, answer questions, and follow up with pet parents—24/7.",
    imageSrc = "/warm-veterinary-clinic-reception-with-phone-and-ha.jpg",
    primaryButtonText = "Book a Demo",
    primaryButtonHref = "",
    secondaryButtonText = "Hear a Sample Call",
    secondaryButtonHref = "",
  } = props;

  return (
    <section className="gradient-mesh relative w-full overflow-hidden px-6 pt-28 pb-12 lg:px-8">
      <div className="bg-primary/5 pointer-events-none absolute top-32 right-[15%] h-72 w-72 rounded-full blur-3xl" />
      <div className="bg-primary/3 pointer-events-none absolute bottom-20 left-[10%] h-96 w-96 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="glass-card order-2 rounded-3xl p-10 lg:order-1 lg:p-12"
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-primary mb-6 inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase"
            >
              <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
              {eyebrow}
            </motion.span>

            <h1 className="text-foreground font-display mb-5 text-4xl leading-[1.1] font-medium tracking-tight text-balance lg:text-5xl">
              {headline}
            </h1>

            <p className="text-muted-foreground mb-8 max-w-lg text-lg leading-relaxed text-pretty">
              {subheadline}
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href={primaryButtonHref}
                onClick={(e) => e.preventDefault()}
                className="group bg-foreground text-background hover:bg-foreground/90 hover:shadow-foreground/10 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                {primaryButtonText}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
              <a
                href={secondaryButtonHref}
                onClick={(e) => e.preventDefault()}
                className="group text-foreground border-border hover:bg-secondary/50 hover:border-border/80 inline-flex items-center gap-2 rounded-full border px-6 py-3.5 text-sm font-medium transition-all duration-300"
              >
                <span className="bg-primary/10 group-hover:bg-primary/15 flex h-8 w-8 items-center justify-center rounded-full transition-colors">
                  <Play
                    className="text-primary ml-0.5 h-3.5 w-3.5"
                    fill="currentColor"
                  />
                </span>
                {secondaryButtonText}
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.7,
              delay: 0.2,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="relative order-1 lg:order-2"
          >
            <div className="gradient-border relative aspect-square overflow-hidden rounded-3xl lg:aspect-[4/5]">
              <div className="from-primary/5 to-primary/10 absolute inset-[1px] overflow-hidden rounded-[calc(1.5rem-1px)] bg-gradient-to-br via-transparent">
                <Image
                  src={imageSrc || "/placeholder.svg"}
                  alt="OdisAI Voice Agent"
                  fill
                  className="object-cover"
                />
                <div className="from-foreground/5 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="glass-strong absolute -bottom-4 -left-4 rounded-2xl p-4 shadow-xl lg:bottom-8 lg:-left-8"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <span className="text-primary text-lg">24</span>
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    24/7 Available
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Never miss a call
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
