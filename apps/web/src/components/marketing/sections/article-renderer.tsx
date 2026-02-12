import { Lightbulb, AlertTriangle, BarChart3 } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface ArticleSection {
  title: string;
  content: string;
  component?: string;
  callout?: {
    type: "tip" | "warning" | "stat";
    text: string;
  };
}

export type ComponentRegistry = Record<string, React.ComponentType<unknown>>;

export interface ArticleRendererProps {
  sections: ArticleSection[];
  /** Map of component keys → React components for rich embeds */
  componentRegistry?: ComponentRegistry;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Callout config                                                            */
/* -------------------------------------------------------------------------- */

const calloutConfig = {
  tip: {
    border: "border-teal-400",
    bg: "bg-gradient-to-r from-teal-50/80 to-teal-50/40",
    ring: "ring-teal-100",
    iconColor: "text-teal-500",
    labelColor: "text-teal-600",
    Icon: Lightbulb,
    label: "Pro Tip",
  },
  warning: {
    border: "border-amber-400",
    bg: "bg-gradient-to-r from-amber-50/80 to-amber-50/40",
    ring: "ring-amber-100",
    iconColor: "text-amber-500",
    labelColor: "text-amber-600",
    Icon: AlertTriangle,
    label: "Important",
  },
  stat: {
    border: "border-violet-400",
    bg: "bg-gradient-to-r from-violet-50/80 to-violet-50/40",
    ring: "ring-violet-100",
    iconColor: "text-violet-500",
    labelColor: "text-violet-600",
    Icon: BarChart3,
    label: "Key Stat",
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Prose class string                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Tailwind Typography prose overrides tuned for data-heavy veterinary
 * resource articles. Tables get first-class treatment with proper
 * cell padding, alternating row tones, and header styling.
 *
 * NOTE: These rely on @tailwindcss/typography being registered via
 * `@plugin "@tailwindcss/typography"` in globals.css.
 */
const proseClasses = [
  // Base
  "prose prose-slate max-w-none",

  // Headings — editorial weight with teal left-rule accent
  "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-slate-800",
  "prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-[1.125rem] prose-h3:leading-snug",
  "prose-h3:border-l-[3px] prose-h3:border-teal-400 prose-h3:pl-3.5",
  "prose-h4:mt-6 prose-h4:mb-2 prose-h4:text-base",

  // Body copy — generous leading for long reads
  "prose-p:text-[0.9375rem] prose-p:leading-[1.85] prose-p:text-slate-600",
  "prose-p:my-4",

  // Links
  "prose-a:font-medium prose-a:text-teal-600 prose-a:underline prose-a:decoration-teal-300/50 prose-a:underline-offset-2",
  "hover:prose-a:text-teal-700 hover:prose-a:decoration-teal-400",

  // Bold / strong
  "prose-strong:font-semibold prose-strong:text-slate-800",

  // Lists — spaced out with teal markers
  "prose-ul:my-5 prose-ul:space-y-2.5",
  "prose-ol:my-5 prose-ol:space-y-2.5",
  "prose-li:text-[0.9375rem] prose-li:leading-relaxed prose-li:text-slate-600",
  "prose-li:marker:text-teal-400",

  // Tables — the centrepiece for data articles
  "prose-table:my-8 prose-table:w-full prose-table:overflow-hidden prose-table:rounded-xl",
  "prose-table:border prose-table:border-slate-200 prose-table:shadow-sm",
  "prose-thead:bg-slate-800 prose-thead:text-white",
  "prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-th:uppercase prose-th:tracking-wider prose-th:text-slate-200",
  "prose-th:border-b prose-th:border-slate-700",
  "prose-tbody:divide-y prose-tbody:divide-slate-100",
  "prose-td:px-4 prose-td:py-3 prose-td:text-sm prose-td:text-slate-600",
  "prose-tr:even:bg-slate-50/60",

  // Block quotes (if any)
  "prose-blockquote:border-l-teal-400 prose-blockquote:bg-slate-50/50 prose-blockquote:rounded-r-lg",
  "prose-blockquote:pl-5 prose-blockquote:py-1 prose-blockquote:text-slate-600 prose-blockquote:not-italic",

  // Code (inline)
  "prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.8125rem] prose-code:font-normal prose-code:text-slate-700",
  "prose-code:before:content-none prose-code:after:content-none",

  // Horizontal rules
  "prose-hr:border-slate-200",

  // Images
  "prose-img:rounded-xl prose-img:shadow-md",
].join(" ");

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function ArticleRenderer({
  sections,
  componentRegistry,
  className,
}: ArticleRendererProps) {
  return (
    <div className={cn("min-w-0", className)}>
      {sections.map((section, index) => {
        const sectionNum = String(index + 1).padStart(2, "0");
        const RegisteredComponent =
          section.component && componentRegistry?.[section.component];

        return (
          <article
            key={section.title}
            id={`section-${index}`}
            className="scroll-mt-24"
          >
            {/* Section divider */}
            {index > 0 && (
              <div className="my-12 flex items-center gap-4 sm:my-16">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              </div>
            )}

            {/* Section heading with number accent */}
            <div className="mb-8 flex items-baseline gap-4">
              <span className="font-mono text-sm font-semibold text-teal-400/80 tabular-nums">
                {sectionNum}
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {section.title}
              </h2>
            </div>

            {/* Prose content */}
            <div
              className={proseClasses}
              dangerouslySetInnerHTML={{ __html: section.content }}
            />

            {/* Optional React component embed */}
            {RegisteredComponent && (
              <div className="my-8">
                <RegisteredComponent />
              </div>
            )}

            {/* Callout */}
            {section.callout && (
              <CalloutBlock
                type={section.callout.type}
                text={section.callout.text}
              />
            )}
          </article>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Callout sub-component                                                     */
/* -------------------------------------------------------------------------- */

function CalloutBlock({
  type,
  text,
}: {
  type: "tip" | "warning" | "stat";
  text: string;
}) {
  const config = calloutConfig[type];
  const { Icon } = config;

  return (
    <div
      className={cn(
        "mt-8 rounded-xl border-l-4 p-5 ring-1 sm:p-6",
        config.border,
        config.bg,
        config.ring,
      )}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <Icon className={cn("h-4 w-4", config.iconColor)} />
        <span
          className={cn(
            "text-[0.6875rem] font-bold tracking-[0.1em] uppercase",
            config.labelColor,
          )}
        >
          {config.label}
        </span>
      </div>
      <p className="text-[0.9375rem] leading-relaxed text-slate-700">{text}</p>
    </div>
  );
}
