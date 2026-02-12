import Image from "next/image";
import { Link2, CheckCircle2 } from "lucide-react";
import { SectionBackground } from "../ui/section-background";

interface IntegrationApp {
  name: string;
  logo: string;
  status?: "active" | "coming-soon";
}

interface IntegrationsSectionProps {
  title?: string;
  subtitle?: string;
  topRowApps?: IntegrationApp[];
  bottomRowApps?: IntegrationApp[];
}

const defaultTopRowApps: IntegrationApp[] = [
  { name: "IDEXX Neo", logo: "/integrations/idexx.svg", status: "active" },
  { name: "ezyVet", logo: "/integrations/ezyvet.svg", status: "active" },
  {
    name: "Cornerstone",
    logo: "/integrations/cornerstone.svg",
    status: "active",
  },
  { name: "AVImark", logo: "/integrations/avimark.svg", status: "coming-soon" },
  {
    name: "Covetrus Pulse",
    logo: "/integrations/covetrus.svg",
    status: "coming-soon",
  },
  {
    name: "Hippo Manager",
    logo: "/integrations/hippo.svg",
    status: "coming-soon",
  },
  {
    name: "Shepherd",
    logo: "/integrations/shepherd.svg",
    status: "coming-soon",
  },
];

const defaultBottomRowApps: IntegrationApp[] = [
  {
    name: "Shepherd",
    logo: "/integrations/shepherd.svg",
    status: "coming-soon",
  },
  {
    name: "Hippo Manager",
    logo: "/integrations/hippo.svg",
    status: "coming-soon",
  },
  {
    name: "Covetrus Pulse",
    logo: "/integrations/covetrus.svg",
    status: "coming-soon",
  },
  { name: "AVImark", logo: "/integrations/avimark.svg", status: "coming-soon" },
  {
    name: "Cornerstone",
    logo: "/integrations/cornerstone.svg",
    status: "active",
  },
  { name: "ezyVet", logo: "/integrations/ezyvet.svg", status: "active" },
  { name: "IDEXX Neo", logo: "/integrations/idexx.svg", status: "active" },
];

const IntegrationLogo = ({ app }: { app: IntegrationApp }) => {
  return (
    <div className="flex h-12 w-32 flex-shrink-0 items-center justify-center px-4">
      <Image
        src={app.logo}
        alt={app.name}
        width={120}
        height={40}
        className="block h-8 w-full object-contain opacity-50 grayscale transition-all duration-300 hover:opacity-80 hover:grayscale-0"
      />
    </div>
  );
};

export const IntegrationsSection = ({
  subtitle = "OdisAI integrates with the tools you already use\u2014so every call syncs seamlessly with your patient records.",
  topRowApps = defaultTopRowApps,
  bottomRowApps = defaultBottomRowApps,
}: IntegrationsSectionProps) => {
  return (
    <section
      id="integrations"
      className="relative w-full overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32"
    >
      <SectionBackground variant="mesh-cool" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center text-center lg:mb-16">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/80 px-4 py-1.5 text-xs font-semibold tracking-widest text-teal-700 uppercase backdrop-blur-sm">
              <Link2 className="h-3.5 w-3.5" />
              Integrations
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />3 Active · 4 Coming Soon
            </span>
          </div>
          <h2 className="font-display mb-4 max-w-2xl text-2xl font-medium tracking-tight text-slate-800 sm:text-3xl md:text-4xl lg:text-5xl">
            Connects with your{" "}
            <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              practice management
            </span>{" "}
            system
          </h2>
          <p className="text-muted-foreground max-w-xl text-lg">{subtitle}</p>
        </div>
      </div>

      <div className="relative h-[140px] overflow-hidden">
        <div
          className="absolute top-4 flex transform-gpu items-center gap-12 whitespace-nowrap"
          style={{
            animation: "scroll-left 25s linear infinite",
            willChange: "transform",
          }}
        >
          {[...topRowApps, ...topRowApps].map((app, index) => (
            <IntegrationLogo key={`top-${index}`} app={app} />
          ))}
        </div>

        <div className="from-background pointer-events-none absolute inset-y-0 right-0 z-20 w-32 bg-gradient-to-l to-transparent lg:w-48" />
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 z-20 w-32 bg-gradient-to-r to-transparent lg:w-48" />

        <div
          className="absolute top-[76px] flex transform-gpu items-center gap-12 whitespace-nowrap"
          style={{
            animation: "scroll-left-slow 35s linear infinite",
            willChange: "transform",
          }}
        >
          {[...bottomRowApps, ...bottomRowApps].map((app, index) => (
            <IntegrationLogo key={`bottom-${index}`} app={app} />
          ))}
        </div>
      </div>
    </section>
  );
};
